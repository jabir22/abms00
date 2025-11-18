# Area Management System - Documentation

## Overview

Area Management System is a comprehensive feature that allows organizations to create, manage, and assign geographical areas to users with role-based permission control.

## Features

### 1. **Area CRUD Operations**
- Create new areas with Bengali and English names
- View all areas with detailed information
- Update area information
- Delete areas
- Search and filter areas

### 2. **User Assignment**
- Assign multiple users to areas
- Manage user-area relationships
- View users in each area
- Remove users from areas

### 3. **Permission-Based Access Control**
- Admin: Full CRUD access (create, read, update, delete)
- Area Manager: Limited CRUD access (create, read, update) but cannot delete
- User: Read-only access

### 4. **Area Hierarchy**
- Support for parent areas (optional)
- Regional organization
- Area codes for unique identification

## Database Schema

### Tables

#### `areas`
```sql
CREATE TABLE areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_bn VARCHAR(255) NOT NULL UNIQUE,
  name_en VARCHAR(255) NOT NULL UNIQUE,
  description_bn TEXT,
  description_en TEXT,
  code VARCHAR(50) UNIQUE,
  region VARCHAR(255),
  parent_id INT,
  is_active BOOLEAN DEFAULT 1,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `user_areas`
```sql
CREATE TABLE user_areas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  area_id INT NOT NULL,
  assigned_by INT,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_area (user_id, area_id)
);
```

#### `area_permissions`
```sql
CREATE TABLE area_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  area_id INT NOT NULL,
  role_id INT NOT NULL,
  permission_name VARCHAR(255) NOT NULL,
  can_create BOOLEAN DEFAULT 0,
  can_read BOOLEAN DEFAULT 1,
  can_update BOOLEAN DEFAULT 0,
  can_delete BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_area_role_perm (area_id, role_id, permission_name)
);
```

## API Endpoints

### Base URL: `/api/areas`

### GET Endpoints

#### 1. Get All Areas
```
GET /api/areas/all
Query Parameters:
  - search: string (search in name or code)
  - region: string (filter by region)
  - active: boolean (filter by active status)

Response:
{
  "success": true,
  "message": "Areas retrieved successfully",
  "data": [
    {
      "id": 1,
      "name_bn": "ঢাকা",
      "name_en": "Dhaka",
      "code": "DHA",
      "region": "Central",
      "user_count": 5,
      "permission_count": 3,
      "is_active": 1,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 6
}
```

#### 2. Get Area By ID
```
GET /api/areas/:id

Response:
{
  "success": true,
  "message": "Area retrieved successfully",
  "data": {
    "id": 1,
    "name_bn": "ঢাকা",
    "name_en": "Dhaka",
    "description_bn": "ঢাকা অঞ্চল",
    "description_en": "Dhaka Region",
    "code": "DHA",
    "region": "Central",
    "parent_id": null,
    "is_active": 1,
    "created_by": 1,
    "created_by_name": "Admin",
    "users": [...],
    "permissions": [...]
  }
}
```

#### 3. Get User Areas
```
GET /api/areas/user/:userId

Response:
{
  "success": true,
  "message": "User areas retrieved successfully",
  "data": [...],
  "count": 3
}
```

#### 4. Get Area Users
```
GET /api/areas/area/:areaId/users

Response:
{
  "success": true,
  "message": "Area users retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com",
      "assigned_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 5
}
```

### POST Endpoints

#### 1. Create Area
```
POST /api/areas/create
Authorization: Required (admin or area_manager role)

Request Body:
{
  "name_bn": "সিলেট",
  "name_en": "Sylhet",
  "description_bn": "সিলেট অঞ্চল",
  "description_en": "Sylhet Region",
  "code": "SYL",
  "region": "North-East",
  "parent_id": null
}

Response:
{
  "success": true,
  "message": "Area created successfully",
  "data": {
    "id": 7,
    "name_bn": "সিলেট",
    "name_en": "Sylhet",
    ...
  }
}
```

#### 2. Assign User to Area
```
POST /api/areas/assign-user
Authorization: Required

Request Body:
{
  "areaId": 1,
  "userId": 5
}

Response:
{
  "success": true,
  "message": "User assigned to area successfully"
}
```

#### 3. Remove User from Area
```
POST /api/areas/remove-user
Authorization: Required

Request Body:
{
  "areaId": 1,
  "userId": 5
}

Response:
{
  "success": true,
  "message": "User removed from area successfully"
}
```

### PUT Endpoints

#### Update Area
```
PUT /api/areas/:id
Authorization: Required (admin or area_manager role)

Request Body:
{
  "name_bn": "নতুন নাম",
  "name_en": "New Name",
  "description_bn": "আপডেট করা বর্ণনা",
  "description_en": "Updated Description",
  "code": "NEW",
  "region": "Central",
  "is_active": 1
}

Response:
{
  "success": true,
  "message": "Area updated successfully",
  "data": {...}
}
```

### DELETE Endpoints

#### Delete Area
```
DELETE /api/areas/:id
Authorization: Required (admin role only)

Response:
{
  "success": true,
  "message": "Area deleted successfully"
}
```

## Frontend

### HTML File
**Location**: `/public/areas/index.html`

### CSS File
**Location**: `/public/css/areas.css`
**Features**:
- Responsive design (mobile, tablet, desktop)
- Modern gradient UI with orange accent
- Smooth animations and transitions
- Modal dialogs for add/edit forms
- Confirmation popups for destructive actions

### JavaScript File
**Location**: `/public/js/areas.js`
**Functions**:
- `loadAreas()`: Fetch all areas from API
- `loadUsers()`: Fetch all users for assignment
- `renderAreasTable()`: Display areas in table
- `openAreaModal()`: Open add/edit modal
- `openAssignModal()`: Open user assignment modal
- `handleAreaFormSubmit()`: Create/update area
- `handleAssignUserSubmit()`: Assign user to area
- `filterAreas()`: Search and filter areas
- `confirmDelete()`: Show confirmation dialog
- `deleteArea()`: Delete area from database
- `updateStats()`: Update statistics cards
- `showToast()`: Display notifications

## Usage

### For Users

1. **View All Areas**
   - Navigate to `/public/areas/index.html` or access from main menu
   - All areas are displayed in a searchable table

2. **Search Areas**
   - Use the search box to find areas by name or code
   - Filter by region or status using the filter bar

3. **View Area Details**
   - Click on an area row to view its details
   - See users assigned to the area

### For Area Managers

1. **Create New Area**
   - Click "Add New Area" button
   - Fill in Bengali and English names
   - Add description and region
   - Click "Save Area"

2. **Assign Users**
   - Click the "+" button in the Actions column
   - Select a user from the dropdown
   - Click "Assign User"

3. **Update Area**
   - Click the edit button in the Actions column
   - Update information
   - Click "Save Area"

### For Administrators

1. **Full Management**
   - All user permissions available
   - Can delete areas
   - Can manage all areas and users

2. **Permission Control**
   - Edit area permissions for different roles
   - Control who can create, read, update, delete areas

## Installation

### 1. Run Migration
```sql
-- Run the areas.sql migration
source db/migrations/areas.sql;
```

### 2. Seed Default Data
```sql
-- Insert default areas
source seed/insert_default_areas.sql;

-- Insert default permissions
source seed/insert_default_area_permissions.sql;
```

### 3. Add Area Manager Role (if not exists)
```sql
-- Ensure area_manager role exists
INSERT INTO roles (name, description) 
VALUES ('area_manager', 'Can manage areas and assign users')
ON DUPLICATE KEY UPDATE description = 'Can manage areas and assign users';
```

### 4. Update Server Configuration
- Ensure `/api/areas` route is registered in `server.js`
- Verify CSRF token middleware is enabled
- Check database connection is working

## Security

### Authentication
- All endpoints require authentication
- User must be logged in to access area management

### Authorization
- Role-based permission checking
- Users can only perform actions based on their role
- Permission middleware validates all requests

### Data Protection
- CSRF token validation on all POST/PUT/DELETE requests
- SQL injection prevention through parameterized queries
- Input validation on all form fields

## Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Area not found"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `403`: Permission Denied
- `404`: Not Found
- `409`: Conflict (duplicate code)
- `500`: Server Error

## Statistics

The system tracks:
- Total number of areas
- Number of active areas
- Total users assigned to areas
- User count per area
- Permission counts per area

## File Structure

```
Area Management System
├── db/migrations/
│   └── areas.sql               (Database schema)
├── seed/
│   └── insert_default_area_permissions.sql
├── models/
│   └── area.model.js           (Database model)
├── controllers/
│   └── areaController.js       (Business logic)
├── routes/
│   └── areaRoutes.js           (API endpoints)
├── public/
│   ├── areas/
│   │   └── index.html          (Frontend page)
│   ├── css/
│   │   └── areas.css           (Styles)
│   └── js/
│       └── areas.js            (Frontend logic)
└── server.js                   (Route registration)
```

## Future Enhancements

1. **Area Hierarchy**
   - Better parent-child area relationships
   - Cascade permissions from parent areas

2. **Bulk Operations**
   - Bulk assign users to areas
   - Bulk update area properties

3. **Analytics**
   - Area performance metrics
   - User distribution across areas
   - Activity logs for area changes

4. **Export/Import**
   - Export areas to CSV/Excel
   - Import areas from CSV/Excel

5. **Advanced Filtering**
   - Filter by creation date
   - Filter by responsible user
   - Complex search queries

## Support

For issues or questions:
1. Check the error message in browser console
2. Verify database connection
3. Check user permissions
4. Review server logs for detailed errors

---

**Last Updated**: December 2024
**Version**: 1.0.0
