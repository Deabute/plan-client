# Features Summary

## Current Feature set (As of late 2021)

- Budget time, decide fraction of budget and see utilization as task are tracked
- Manage tasks in a directory-based hierarchy
- Set task due dates and view in an agenda type list
- Track tasks in a zero-based accounting style. i.e. every hour of the day is accounted for
- User owns data source of truth
  - Stored in web Browser / IndexedDB
- Zero login
  - Service credentials for P2P and Cloud are generated by app locally
- Sync user data peer to peer via WebRTC
- Sync data via cloud
  - End to end encrypted with peer to peer pre-shared keys
- Metadata privacy considerations
  - API access is anonymously tokenized after subscription purchase
- Set budget duration/sprint between 1 and 4 weeks
- View historical utilization of time-based on various periods

## Potential future features (As of late 2021)

- With these sources of information and a rating of effort, it's possible to dynamically determine the rate of completion.
- Difficulty rating on task to aid with prediction accuracy
- Sharing for sub-folders of task
- Graph-based data relations for social connection
  - e.g. "Had dinner with my sister", Relates to two activities that one might want to track independently
- Full data back-up with Deabute services
- Sync without peer to peer
- Offline availability
- Set recurring task cadence
  - auto set next due based on cadence, e.g. take the trash out on Wednesday
- Event sourced data model for better data integrity when syncing
- Reinstate drag and drop task prioritization
  - currently, the movement/prioritization system is button based
- Sync between 3+ devices
