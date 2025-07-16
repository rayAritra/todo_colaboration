# Real-Time Collaborative To-Do Board

A full-stack web application that enables multiple users to collaborate on task management in real-time, similar to a minimal Trello board with live synchronization and custom business logic.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure registration and login with JWT tokens and bcrypt password hashing
- **Real-Time Collaboration**: Live updates using WebSockets - see changes instantly across all connected users
- **Kanban Board**: Drag-and-drop interface with three columns (To Do, In Progress, Done)
- **Task Management**: Create, edit, delete, and assign tasks with priority levels
- **Activity Logging**: Track all user actions with timestamps and details
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Unique Features
- **Smart Assign**: Automatically assigns tasks to the user with the fewest active tasks
- **Conflict Resolution**: Detects when multiple users edit the same task simultaneously and provides merge/overwrite options
- **Custom Animations**: Smooth drag-and-drop with rotation and scaling effects
- **Real-time Activity Feed**: Live updates of all user actions across the board

### Technical Features
- **Optimistic Updates**: Immediate UI feedback with server reconciliation
- **Version Control**: Task versioning to detect and handle conflicts
- **Input Validation**: Title uniqueness and column name conflict prevention
- **Custom Styling**: No third-party CSS frameworks - built with Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **@hello-pangea/dnd** for drag-and-drop functionality
- **Socket.IO Client** for real-time communication
- **Radix UI** components for accessible UI elements

### Backend
- **Next.js API Routes** for REST endpoints
- **MongoDB** for data persistence
- **Socket.IO** for WebSocket connections
- **JWT** for authentication
- **bcrypt** for password hashing

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
\`\`\`bash
git clone <your-repo-url>
cd collaborative-todo-board
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
Create a `.env.local` file in the root directory:

\`\`\`env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=collaborative-todo

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Socket.IO (optional - defaults to same origin)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
\`\`\`

### 4. Database Setup
Make sure MongoDB is running locally or set up MongoDB Atlas and update the connection string.

### 5. Run the Application
\`\`\`bash
npm run dev
\`\`\`

The application will be available at `http://localhost:3000`

## 📖 Usage Guide

### Getting Started
1. **Register**: Create a new account with name, email, and password
2. **Login**: Sign in with your credentials
3. **Create Tasks**: Click the "+" button in any column to add a new task
4. **Drag & Drop**: Move tasks between columns by dragging them
5. **Edit Tasks**: Click the menu button on any task to edit or delete
6. **Smart Assign**: Use the "Smart Assign" feature to automatically assign tasks

### Smart Assign Logic
The Smart Assign feature automatically assigns a task to the user with the fewest active tasks (tasks in "To Do" or "In Progress" status). This helps distribute workload evenly across team members.

**How it works:**
1. Counts active tasks for each user
2. Finds the user with the minimum count
3. Assigns the task to that user
4. Logs the action with the reasoning

### Conflict Resolution
When two users edit the same task simultaneously, the system detects the conflict and presents both versions:

**Conflict Detection:**
- Each task has a version number that increments with each update
- When updating, the system checks if the current version is higher than the client's version
- If a conflict is detected, both versions are shown to the user

**Resolution Options:**
1. **Merge**: Combines changes intelligently (your changes take precedence for most fields)
2. **Overwrite**: Replaces the current version entirely with your changes

## 🏗 Architecture

### Database Schema

**Users Collection:**
\`\`\`javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  createdAt: Date
}
\`\`\`

**Tasks Collection:**
\`\`\`javascript
{
  _id: ObjectId,
  title: String (unique),
  description: String,
  status: String ('todo' | 'in-progress' | 'done'),
  priority: String ('low' | 'medium' | 'high'),
  assignedTo: String (user ID),
  assignedToName: String,
  createdBy: String (user ID),
  createdAt: Date,
  updatedAt: Date,
  version: Number
}
\`\`\`

**Activities Collection:**
\`\`\`javascript
{
  _id: ObjectId,
  action: String ('created' | 'updated' | 'deleted' | 'assigned' | 'moved'),
  taskId: String,
  taskTitle: String,
  userId: String,
  userName: String,
  details: String,
  timestamp: Date
}
\`\`\`

### API Endpoints

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

**Tasks:**
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/smart-assign` - Smart assign task
- `POST /api/tasks/[id]/resolve-conflict` - Resolve task conflict

**Users & Activities:**
- `GET /api/users` - Get all users
- `GET /api/activities` - Get recent activities

## 🎨 Custom Features

### Animations
- **Drag Animation**: Tasks rotate and scale when being dragged
- **Hover Effects**: Smooth transitions on task cards
- **Loading States**: Animated spinners for better UX

### Validation Rules
- Task titles must be unique across the entire board
- Task titles cannot match column names ("To Do", "In Progress", "Done")
- Passwords must be at least 6 characters long
- All required fields are validated on both client and server

### Real-Time Features
- Live task updates across all connected users
- Real-time activity feed
- Instant drag-and-drop synchronization
- Live user presence (can be extended)

## 🚀 Deployment

### Frontend Deployment (Vercel)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Backend Deployment (Railway/Render)
1. Set up MongoDB Atlas for production database
2. Update environment variables for production
3. Deploy to your preferred platform
4. Update CORS settings for production domain

### Environment Variables for Production
\`\`\`env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-production-jwt-secret
NEXT_PUBLIC_SOCKET_URL=https://your-production-domain.com
\`\`\`

## 🧪 Testing

The application includes comprehensive error handling and validation:
- Client-side form validation
- Server-side data validation
- Conflict detection and resolution
- Network error handling
- Authentication state management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🎯 Future Enhancements

- **Real-time Cursors**: Show where other users are working
- **Task Comments**: Add commenting system for tasks
- **File Attachments**: Allow file uploads on tasks
- **Advanced Filtering**: Filter tasks by user, priority, date
- **Notifications**: Email/push notifications for task assignments
- **Team Management**: Create teams and manage permissions
- **Time Tracking**: Track time spent on tasks
- **Reporting**: Generate productivity reports

---

**Demo Video**: [Link to your demo video]
**Live Application**: [Link to deployed app]
**GitHub Repository**: [Link to your GitHub repo]
