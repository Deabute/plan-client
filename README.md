# Plan Beta (Working codename)

"Plan" is a tool for budgeting your personal time with abilities to task track with time keep.

## Problems that might lead one to use this tool

- Not sure where the time goes
- Anxious about personal productivity
- Talking about work or working unnecessarily long hours negatively affects relationships
- It's hard to remember appointments and keep to basic routines when busy or engaging in a complex project
- Breaking down and identifying the most important part of a task to work on is difficult

## Solution Goal

Give an individual peace of mind in taking on ambitious projects in balance with other parts of a fulfilling life.

One has a finite amount of time in the day. Plan shows how it gets used a gives the ability to set goals for how it will be used.

## Current Feature set (As of late 2021)

- Budget time, decide fraction of budget and see utilization as task are tracked
- Manage task in a directory based hierarchy
- Set task due dates and view in an agenda type list
- Track task in a zero based accounting style. i.e. every hour of the day is accounted for
- User owns data source of truth
  - Stored in web Browser / IndexedDB
- Zero login
  - Service credentials for P2P and Cloud are generated by app locally
- Sync user data peer to peer via WebRTC
- Sync data via cloud
  - End to end encrypted with peer to peer pre-shared keys
- Meta data privacy considerations
  - API access is anonymously tokenized after subscription purchase
- Set budget duration / sprint between 1 and 4 weeks
- View historical utilization of time based on various periods

## Potential future features (As of late 2021)

- With these sources of information and a rating of effort its possible to dynamically determine rate of completion.
- Difficulty rating on task to aid with prediction accuracy
- Sharing for sub-folders of task
- Graph based data relations for social connection
  - e.g. "Had dinner with my sister", Relates to two activities that one might want to track independently
- Full data back-up with Deabute services
- Sync without peer to peer
- Offline availability
- Set recurring task cadence
  - auto set next due based on cadence, e.g. take the trash out on Wednesday
- Event sourced data model for better data integrity when syncing
- Reinstate drag and drop task prioritization
  - currently the movement / prioritization system is button based
- Sync between 3+ devices

## Inspiration

Kanban board style apps was an inspiration to the idea of drag and drop prioritization and initial auto assignment of budget.

Billable time accounting apps and their lack of budgeting features were an inspiration building this app at the very least as a back scratcher.

After all my problem wasn't tracking billable time, it was having the anxiety that I needed to be doing something productive every moment of the day.

Modern financial budgeting tools and the impact they've had in our life has been an inspiration for applying the same principals to time.

Just a tip from a dilettante: When every dollar has an agreed job, it's easier to sleep at night.

---

Copyright 2021 ~ Paul Beaudet ~ All rights reserved on [README.md](README.md).

The code of this static website is Open Source under the MIT License ~ See [LICENSE](LICENSE) for details

Logos, sayings, presented verbiage, instructions, and, help ~ All rights reserved

designs and iconography outside of the bootstrap ones ~ All rights reserved

Special Copyright note from the author

I'm a big fan of open source and what its done for our world.
However, it's come to light in some recent years that there is some disregard maybe even ignorance for the spirit of what open source is.
In some cases taking advantage of the OSI's "no discrimination" definitions to snipe value away from original Authors.
This might be where RMS raises an eyebrow and says "you should use GPL", but I think even restrictive licenses are just an interpretation of the spirit of OSS.
It also fails to prevent whole cloth rebadging.
It just requires it be a open source rebadge.
Ultimately if someone wants to violate the good will of one these licenses they will.
Just as someone might violate copyright without any license at all.

All that being said, I want to make it clear in plain words what I intended to provide licensees.

- Ability to audit the source that gets run on their computer.
- The opportunity to repair and augment code that gets run on their computer.
- Ability to share improved code freely
- Ability to pick-up the torch upon author abandonment

Thing I do not intend to provide anyone. Licensees or not.

- Ability to copycat, rebadge, and capture the same market segment
- modifying the code for the purposes of unlawful acts

Keep in mind the software is constantly improving and I can change the license at any time to solely serve members of our community

Thanks for understanding,
Paul Beaudet
