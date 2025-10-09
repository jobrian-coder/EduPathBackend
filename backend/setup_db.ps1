# Database Setup Script for EduPath Backend
# Run this from the backend directory

Write-Host "=== EduPath Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Activate virtual environment
Write-Host "Step 1: Activating virtual environment..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1

# Step 2: Verify dependencies
Write-Host "Step 2: Verifying dependencies..." -ForegroundColor Yellow
python -c "import django; print(f'Django version: {django.get_version()}')"

# Step 3: Create migrations
Write-Host "Step 3: Creating migrations..." -ForegroundColor Yellow
python manage.py makemigrations authentication careers courses hubs societies

# Step 4: Apply migrations
Write-Host "Step 4: Applying migrations..." -ForegroundColor Yellow
python manage.py migrate

# Step 5: Create superuser
Write-Host "Step 5: Creating superuser..." -ForegroundColor Yellow
Write-Host "Please enter superuser details:" -ForegroundColor Green
python manage.py createsuperuser

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host "Run 'python manage.py runserver' to start the backend" -ForegroundColor Cyan
