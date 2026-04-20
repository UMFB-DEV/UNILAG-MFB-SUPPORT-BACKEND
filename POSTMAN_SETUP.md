# Postman Collection Setup Guide

## Overview
This guide explains how to use the Postman collection for testing the Ticketing System API.

## Files Created
- `Ticketing-System-API.postman_collection.json` - Complete Postman collection with all endpoints

## Import Collection

1. Open Postman
2. Click **Import** in the top left
3. Select the `Ticketing-System-API.postman_collection.json` file
4. The collection will be imported with all endpoints organized by category

## Environment Variables

The collection uses these variables:
- `baseUrl` - API base URL (default: `http://localhost:4000`)
- `authToken` - Current authentication token
- `adminToken` - Admin user token
- `agentToken` - Agent user token  
- `userToken` - Customer user token
- `ticketId` - Sample ticket ID (replace with actual ID)
- `agentId` - Sample agent ID (replace with actual ID)
- `userId` - Sample user ID (replace with actual ID)

## Testing Workflow

### 1. Setup Users
Run these requests in order to create test users:

1. **Register Admin** - Creates admin@example.com
2. **Register Agent** - Creates agent@example.com  
3. **Register User** - Creates customer@example.com

### 2. Login
Run the login requests to get authentication tokens:

1. **Login Admin** - Sets adminToken and authToken
2. **Login Agent** - Sets agentToken
3. **Login User** - Sets userToken

### 3. Create and Manage Tickets
1. **Create Ticket** - Creates sample tickets
2. **Get Ticket by ID** - Copy the ticket ID from response
3. Update the `{{ticketId}}` variable in Postman
4. **Assign Ticket** - Assign to agent (need agentId)
5. **Update Ticket Status** - Progress through workflow
6. **Add Comments** - Test public and internal comments

### 4. Test Other Features
- **List/Filter Tickets** - Test search and pagination
- **User Management** - Admin-only user operations
- **Reports** - Dashboard metrics and CSV export

## Manual Variable Updates

After running requests, update these variables manually:

1. **ticketId**: Copy from any ticket creation response
2. **agentId**: Copy from user list or registration response  
3. **userId**: Copy from user list or registration response

## Request Categories

### Authentication
- Register users with different roles
- Login and get tokens
- Get current user info

### Tickets
- Full CRUD operations
- Status workflow management
- Assignment to agents
- Advanced filtering and search

### Comments
- Public comments (visible to all)
- Internal comments (agents/admins only)

### User Management (Admin only)
- List all users
- Create/update/delete users

### Reports (Admin/Agent)
- Dashboard summary metrics
- CSV export functionality

## Testing Tips

1. **Run in order**: Follow the workflow sequence for proper testing
2. **Check responses**: Verify success/error messages
3. **Update variables**: Replace placeholder IDs with actual ones from responses
4. **Test permissions**: Try accessing endpoints with wrong user roles
5. **Status workflow**: Test valid transitions (open→in_progress→resolved→closed)
6. **Error handling**: Test invalid data and missing fields

## Common Test Scenarios

### Permission Testing
- Try user management with non-admin token
- Try assigning tickets with user token
- Try internal comments with user token

### Workflow Testing
- Complete full ticket lifecycle
- Test invalid status transitions
- Test comments on closed tickets

### Search Testing
- Filter by status, priority, category
- Search by keywords
- Test pagination with different limits

## API Base URL
Default is `http://localhost:4000`. Update if your server runs on different port or host.

## Troubleshooting

1. **401 Unauthorized**: Check token is set correctly
2. **403 Forbidden**: Verify user has required role
3. **404 Not Found**: Check URL and resource IDs
4. **400 Bad Request**: Validate request body format
5. **Connection refused**: Ensure server is running on correct port
