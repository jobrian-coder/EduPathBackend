import base64
from datetime import datetime
import json
import logging
import requests
import uuid
from django.conf import settings

logger = logging.getLogger(__name__)

class MpesaClient:
    def __init__(self):
        self.consumer_key = getattr(settings, 'MPESA_CONSUMER_KEY', '')
        self.consumer_secret = getattr(settings, 'MPESA_CONSUMER_SECRET', '')
        self.shortcode = getattr(settings, 'MPESA_SHORTCODE', '174379')
        self.passkey = getattr(settings, 'MPESA_PASSKEY', '')
        self.env = getattr(settings, 'MPESA_ENV', 'sandbox')
        self.callback_url = getattr(settings, 'MPESA_CALLBACK_URL', '')

        # Determine if we should run in mock/simulator mode
        self.is_mock = not (self.consumer_key and self.consumer_secret)
        if self.is_mock:
            logger.warning("M-Pesa API keys are missing. Operating in Mock/Simulator Mode.")

        if self.env == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'

    def get_access_token(self):
        if self.is_mock:
            return "mock_access_token"

        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        try:
            response = requests.get(
                url,
                auth=(self.consumer_key, self.consumer_secret),
                timeout=10
            )
            response.raise_for_status()
            return response.json().get('access_token')
        except Exception as e:
            logger.error(f"Error fetching access token from Safaricom: {e}")
            raise Exception("Failed to authorize with Safaricom Daraja API.")

    def initiate_stk_push(self, phone_number, amount, account_ref, transaction_desc):
        """
        Initiate M-Pesa STK Push (Lipa Na M-Pesa Online).
        phone_number should be formatted in international format without plus sign, e.g., 254712345678.
        """
        # Format phone number if needed (e.g. from 07... or +254... to 254...)
        formatted_phone = phone_number.replace('+', '').strip()
        if formatted_phone.startswith('0'):
            formatted_phone = '254' + formatted_phone[1:]
        elif formatted_phone.startswith('7') or formatted_phone.startswith('1'):
            formatted_phone = '254' + formatted_phone

        # Safeguard for length
        if not formatted_phone.startswith('254') or len(formatted_phone) != 12:
            logger.warning(f"Invalid phone number structure: {phone_number}. Attempting raw usage.")
        
        amount = int(amount)

        if self.is_mock:
            checkout_request_id = f"mock_{uuid.uuid4().hex[:16]}"
            logger.info(f"[MOCK MPESA] STK Push request generated for {formatted_phone} - amount KES {amount}. CheckoutRequestID: {checkout_request_id}")
            return {
                "MerchantRequestID": f"mock_merch_{uuid.uuid4().hex[:8]}",
                "CheckoutRequestID": checkout_request_id,
                "ResponseCode": "0",
                "ResponseDescription": "Success. Request accepted for processing",
                "CustomerMessage": "Success. Request accepted for processing",
                "is_mock": True
            }

        access_token = self.get_access_token()
        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode('utf-8')).decode('utf-8')

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": formatted_phone,
            "PartyB": self.shortcode,
            "PhoneNumber": formatted_phone,
            "CallBackURL": self.callback_url,
            "AccountReference": account_ref,
            "TransactionDesc": transaction_desc
        }

        try:
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            logger.info(f"Safaricom STK response: {response.text}")
            response.raise_for_status()
            res_data = response.json()
            res_data["is_mock"] = False
            return res_data
        except Exception as e:
            logger.error(f"Safaricom STK Push failed: {e}")
            raise Exception("Failed to initiate M-Pesa payment. Please verify settings.")
