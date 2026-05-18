# Admin Dashboard User Guide

This guide explains how to use the EduPath Admin Dashboard to manage courses and universities.

## Access Requirements

1. Your user account must have `role = 'admin'` in the database
2. Navigate to: `http://localhost:5173/admin` (or your deployed URL)
3. Login with your admin credentials if prompted

## Adding a Course to a University

To add **Computer Science** to **Kenyatta University**, follow these steps:

### Step 1: Verify Kenyatta University Exists

1. Go to **Admin Dashboard** → **Universities** (or navigate to `/admin/universities`)
2. Search for "Kenya" or "Kenyatta" in the search box
3. If Kenyatta University appears in the list, proceed to Step 2
4. If not, click **"Add University"** and fill in:
   - **Name**: Kenyatta University
   - **Short Name**: KU
   - **Type**: Public
   - **Location**: Nairobi
   - **Website**: https://www.ku.ac.ke
   - Click **"Create University"**

### Step 2: Add the Computer Science Course

1. Go to **Admin Dashboard** → **Courses** (or navigate to `/admin/courses`)
2. Click **"Add Course"**
3. Fill in the course details:

| Field | Example Value |
|-------|---------------|
| **Course Name** | Bachelor of Science in Computer Science |
| **Category** | Technology |
| **Institution** | Kenyatta University |
| **Duration** | 4 years |
| **Description** | A comprehensive program covering software development, algorithms, databases, networking, and computer systems... |
| **Cutoff Points 2023** | 35 |
| **Cutoff Points 2022** | 34 |
| **Fees (KSh)** | 120000 |

4. Click **"Create Course"**

### Step 3: Link Course to University (Create Program)

The course is created but not yet linked to the university. You need to create a **Course-University relationship** (also called a "Program"):

#### Option A: Using the Admin API (Backend)

```bash
# Get admin auth token first
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "yourpassword"}'

# Create the course-university relationship
curl -X POST http://localhost:8000/api/courses/admin/course-universities/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "course": "COMPUTER_SCIENCE_COURSE_ID",
    "university": "KENYATTA_UNIVERSITY_ID",
    "fees_ksh": 120000,
    "cutoff_points": 35,
    "course_url": "https://www.ku.ac.ke/program/bsc-computer-science"
  }'
```

#### Option B: Direct Database (Django Admin)

1. Access Django Admin at `http://localhost:8000/admin/`
2. Login with superuser credentials
3. Navigate to **Courses** → **Course universities**
4. Click **"Add course university"**
5. Fill in:
   - **Course**: Select "Bachelor of Science in Computer Science"
   - **University**: Select "Kenyatta University"
   - **Fees ksh**: 120000
   - **Cutoff points**: 35
6. Click **Save**

## Managing Courses

### Editing a Course

1. Go to `/admin/courses`
2. Find the course in the list
3. Click the **Edit** (pencil) icon
4. Modify the fields as needed
5. Click **"Update Course"**

### Deleting a Course

1. Go to `/admin/courses`
 2. Find the course
3. Click the **Delete** (trash) icon
4. Confirm the deletion

**Note**: Deleting a course will also remove all its university associations.

## Managing Universities

### Adding a New University

1. Go to `/admin/universities`
2. Click **"Add University"**
3. Fill in all required fields:
   - Name, Type (Public/Private), Location
4. Optional fields:
   - Established year, Ranking, Student count, Facilities
5. Click **"Create University"**

### Bulk Operations

The admin API supports bulk operations for efficiency:

**Bulk Create Courses:**
```bash
POST /api/courses/admin/courses/bulk_create/
{
  "courses": [
    {"name": "Course 1", "category": "Technology", ...},
    {"name": "Course 2", "category": "Medicine", ...}
  ]
}
```

**Bulk Update Courses:**
```bash
POST /api/courses/admin/courses/bulk_update/
{
  "courses": [
    {"id": "course-id-1", "cutoff_2023": 32},
    {"id": "course-id-2", "cutoff_2023": 33}
  ]
}
```

## Troubleshooting

### "Access Denied" Error

- Ensure your user has `role = 'admin'` in the database
- Check that you're logged in: try logging out and back in

### Course Not Appearing in Directory

1. Verify the course was created successfully
2. Check that the course-university relationship exists
3. Ensure `is_enriched = true` in the course data (for display purposes)
4. Refresh the directory page

### API Errors (401 Unauthorized)

- Your auth token may have expired
- Log out and log back in to refresh the token
- Verify you have admin role: check `user.role` in browser dev tools

## Data Structure Reference

### Course Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full course name |
| category | string | Yes | Technology, Medicine, Engineering, etc. |
| institution | string | No | Primary institution name |
| duration | string | Yes | e.g., "4 years" |
| description | text | Yes | Course description |
| cutoff_2023 | number | No | 2023 cutoff points |
| cutoff_2022 | number | No | 2022 cutoff points |
| fees_ksh | number | No | Annual fees in Kenyan Shillings |
| cluster_subjects | string[] | No | Required KCSE subjects |

### University Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Full university name |
| short_name | string | No | Abbreviation (e.g., "KU") |
| type | enum | Yes | "Public" or "Private" |
| location | string | Yes | City/Town |
| website | string | No | Official website URL |
| established | number | No | Year founded |
| ranking | number | No | National ranking |

## Need Help?

Contact the development team if you encounter issues with:
- Admin dashboard not loading
- Permission errors
- Data not saving
- API connectivity problems
