# Logic Document: Smart Assign & Conflict Handling

## Smart Assign Implementation

### Overview
The Smart Assign feature automatically assigns tasks to the team member with the fewest active tasks, ensuring balanced workload distribution across the team.

### Algorithm Logic

1. **Task Counting**: 
   - Query the database to count active tasks (status: 'todo' or 'in-progress') for each user
   - Exclude completed tasks from the count as they don't represent current workload

2. **User Selection**:
   - Iterate through all users and their respective active task counts
   - Identify the user with the minimum number of active tasks
   - In case of a tie, the first user encountered with the minimum count is selected

3. **Assignment Process**:
   - Update the task's `assignedTo` field with the selected user's ID
   - Update the task's `assignedToName` field with the user's display name
   - Increment the task version number for conflict detection
   - Log the assignment action with details about the reasoning

### Example Scenario
\`\`\`
Users and their active task counts:
- Alice: 3 active tasks
- Bob: 1 active task  
- Charlie: 2 active tasks

Smart Assign Result: Task assigned to Bob (fewest active tasks)
\`\`\`

### Benefits
- **Load Balancing**: Prevents task overload on individual team members
- **Fairness**: Ensures equitable distribution of work
- **Efficiency**: Reduces manual assignment overhead
- **Transparency**: Logs the reasoning behind each assignment

## Conflict Handling Implementation

### Overview
The conflict handling system detects when multiple users attempt to edit the same task simultaneously and provides resolution mechanisms to prevent data loss.

### Conflict Detection

1. **Version Control**:
   - Each task maintains a `version` number that increments with every update
   - When a user loads a task for editing, the current version is captured
   - Upon submission, the system compares the client's version with the current server version

2. **Conflict Identification**:
   - If server version > client version, a conflict is detected
   - This indicates another user has modified the task since the current user started editing

### Resolution Mechanisms

#### 1. Merge Strategy
- **Logic**: Intelligently combines changes from both versions
- **Implementation**: 
  - User's changes take precedence for most fields (title, description, priority, assignment)
  - Preserves server's metadata (creation date, version history)
  - Creates a hybrid version that incorporates both sets of changes

#### 2. Overwrite Strategy  
- **Logic**: Completely replaces server version with user's changes
- **Implementation**:
  - Discards all server changes made after user started editing
  - Applies user's changes as the definitive version
  - Updates version number to reflect the overwrite

### Conflict Resolution Process

1. **Detection Phase**:
   \`\`\`
   User submits changes → Version check → Conflict detected
   \`\`\`

2. **Presentation Phase**:
   - Display both versions side-by-side
   - Highlight differences between versions
   - Show timestamps and user information for context

3. **Resolution Phase**:
   - User selects merge or overwrite strategy
   - System applies chosen resolution
   - Updates task with resolved version
   - Logs conflict resolution action

### Example Conflict Scenario

\`\`\`
Initial Task State:
- Title: "Fix login bug"
- Status: "todo"
- Priority: "medium"
- Version: 1

User A starts editing (Version 1)
User B edits and saves:
- Status: "in-progress" 
- Priority: "high"
- Version: 2

User A tries to save:
- Title: "Fix critical login bug"
- Description: "Added detailed description"
- Version: 1 (outdated)

Conflict Detected!

Resolution Options:
1. Merge: Combines A's title/description with B's status/priority
2. Overwrite: Uses only A's changes, discarding B's updates
\`\`\`

### Benefits of Conflict Handling

- **Data Integrity**: Prevents accidental overwrites and data loss
- **User Awareness**: Makes users aware of concurrent modifications
- **Flexibility**: Provides multiple resolution strategies
- **Audit Trail**: Maintains complete history of conflict resolutions
- **Collaboration**: Enables safe concurrent editing in team environments

### Technical Implementation Notes

- **Optimistic Locking**: Uses version numbers instead of database locks for better performance
- **Real-time Updates**: WebSocket integration ensures users see changes immediately
- **Graceful Degradation**: System remains functional even if real-time features fail
- **User Experience**: Conflict resolution UI is intuitive and non-disruptive
