export type ScheduleCategory =
  | 'ceremony'
  | 'hacking'
  | 'workshop'
  | 'food'
  | 'activity'
  | 'quiet'
  | 'judging'
  | 'milestone';

export type ScheduleDay = {
  id: string;
  title: string;
  date: string;
  summary: string;
  slots: ScheduleSlot[];
};

export type ScheduleSlot = {
  timeRange: string;
  highlight?: boolean;
  events: ScheduleEvent[];
};

export type ScheduleEvent = {
  title: string;
  type: ScheduleCategory;
  start: string;
  end?: string;
  location?: string;
};

export const schedule: ScheduleDay[] = [
  {
    id: 'day-1',
    title: 'Day 1',
    date: 'Saturday, October 4',
    summary: 'Welcome to HackUTA 2025!',
    slots: [
      {
        timeRange: '8:00 – 11:00 AM',
        highlight: true,
        events: [
          {
            title: 'Check-in & Welcome',
            type: 'ceremony',
            start: '8:00 AM',
            end: '11:00 AM',
            location: 'SWSH Breezeway',
          },
        ],
      },
      {
        timeRange: '11:00 AM – 12:00 PM',
        highlight: true,
        events: [
          {
            title: 'Opening Ceremony',
            type: 'ceremony',
            start: '11:00 AM',
            end: '12:00 PM',
            location: 'SEIR 194 + 198',
          },
        ],
      },
      {
        timeRange: '12:00 – 1:30 PM',
        highlight: true,
        events: [
          {
            title: 'Hacking Begins',
            type: 'hacking',
            start: '12:00 PM',
            location: 'Throughout SWSH & SEIR',
          },
          {
            title: 'Lunch & Team Formation',
            type: 'food',
            start: '12:00 PM',
            end: '1:30 PM',
            location: 'SWSH Yard',
          },
        ],
      },
      {
        timeRange: '1:00 – 2:00 PM',
        events: [
          {
            title: 'MLH GitHub Workshop',
            type: 'workshop',
            start: '1:00 PM',
            end: '1:45 PM',
            location: 'Room TBD',
          },
          {
            title: 'Talk: Will Maberry - Perplexity AI',
            type: 'workshop',
            start: '1:15 PM',
            end: '1:45 PM',
            location: 'Room TBD',
          },
        ],
      },
      {
        timeRange: '2:00 – 3:00 PM',
        events: [
          {
            title: 'The Physics of Image Generation w/ Alex Dilhoff',
            type: 'workshop',
            start: '2:00 PM',
            end: '3:00 PM',
            location: 'Room TBD',
          },
        ],
      },
      {
        timeRange: '3:00 – 4:00 PM',
        events: [
          {
            title: 'MathWorks Workshop',
            type: 'workshop',
            start: '3:00 PM',
            end: '4:00 PM',
            location: 'Room TBD',
          },
          {
            title: 'Wireless Cybersecurity with Wireshark w/ Trevor Bakker',
            type: 'workshop',
            start: '3:00 PM',
            end: '4:00 PM',
            location: 'Room TBD',
          },
          {
            title: 'Hungry Hungry Hippos',
            type: 'activity',
            start: '3:15 PM',
            end: '3:45 PM',
            location: 'SWSH Open Area',
          },
        ],
      },
      {
        timeRange: '4:00 – 5:00 PM',
        events: [
          {
            title: 'IEEE Workshop',
            type: 'workshop',
            start: '4:00 PM',
            end: '4:45 PM',
            location: 'Room TBD',
          },
        ],
      },
      {
        timeRange: '5:00 – 6:00 PM',
        events: [
          {
            title: 'Ceramics with Girls Who Code',
            type: 'activity',
            start: '5:00 PM',
            end: '5:45 PM',
            location: 'Room TBD',
          },
          {
            title: 'Facepaint Pop-Up',
            type: 'activity',
            start: '5:00 PM',
            end: '5:45 PM',
            location: 'Room TBD',
          },
          {
            title: 'Capture-the-Flag with CSEC',
            type: 'workshop',
            start: '5:00 PM',
            end: '5:45 PM',
            location: 'Room TBD',
          },
        ],
      },
      {
        timeRange: '6:00 – 7:00 PM',
        highlight: true,
        events: [
          {
            title: 'Dinner',
            type: 'food',
            start: '6:00 PM',
            end: '7:00 PM',
            location: 'SWSH Yard',
          },
        ],
      },
      {
        timeRange: '7:00 – 9:00 PM',
        events: [
          {
            title: 'Friendship Bracelets Bar',
            type: 'activity',
            start: '7:15 PM',
            end: '8:00 PM',
            location: 'Room TBD',
          },
          {
            title: 'Figma Workshop w/ Bobby Flennoy',
            type: 'workshop',
            start: '7:15 PM',
            end: '8:15 PM',
            location: 'Room TBD',
          },
          {
            title: 'Bob Ross Painting',
            type: 'activity',
            start: '8:00 PM',
            end: '8:45 PM',
            location: 'Room TBD',
          },
        ],
      },
      {
        timeRange: '9:00 – 11:59 PM',
        events: [
          {
            title: 'Minecraft Speedrun Challenge',
            type: 'activity',
            start: '9:00 PM',
            end: '9:45 PM',
            location: 'Room TBD',
          },
          {
            title: 'Snack Bar',
            type: 'food',
            start: '10:00 PM',
            end: '10:45 PM',
            location: 'Room TBD',
          },
          {
            title: 'Late Night Among Us',
            type: 'activity',
            start: '11:00 PM',
            end: '11:45 PM',
            location: 'Room TBD',
          },
          {
            title: 'Devpost Submission Deadline',
            type: 'milestone',
            start: '11:59 PM',
            location: 'Devpost',
          },
        ],
      },
    ],
  },
  {
    id: 'day-2',
    title: 'Day 2',
    date: 'Sunday, October 5',
    summary:
      'Recharge in the morning, lock in your submissions, then pitch to the judges.',
    slots: [
      {
        timeRange: '12:00 – 7:30 AM',
        events: [
          {
            title: 'Quiet Hours',
            type: 'quiet',
            start: '12:00 AM',
            end: '7:30 AM',
            location: 'All Event Spaces',
          },
        ],
      },
      {
        timeRange: '7:30 – 10:00 AM',
        events: [
          {
            title: 'Breakfast & Morning Check-In',
            type: 'food',
            start: '7:30 AM',
            end: '10:00 AM',
            location: 'SWSH First Floor',
          },
        ],
      },
      {
        timeRange: '10:00 – 11:45 AM',
        events: [
          {
            title: 'Elevator Pitch Practice',
            type: 'workshop',
            start: '10:00 AM',
            end: '10:45 AM',
            location: 'Room TBD',
          },
          {
            title: 'Snack Break',
            type: 'food',
            start: '10:30 AM',
            location: 'SWSH First Floor',
          },
        ],
      },
      {
        timeRange: '12:00 – 1:00 PM',
        highlight: true,
        events: [
          {
            title: 'Hacking Ends',
            type: 'hacking',
            start: '12:00 PM',
            location: 'All Event Spaces',
          },
          {
            title: 'Lunch',
            type: 'food',
            start: '12:00 PM',
            end: '1:00 PM',
            location: 'SWSH First Floor',
          },
        ],
      },
      {
        timeRange: '1:00 – 3:00 PM',
        highlight: true,
        events: [
          {
            title: 'Judging Begins',
            type: 'judging',
            start: '1:00 PM',
            end: '3:00 PM',
            location: 'PKH 104/110',
          },
        ],
      },
    ],
  },
];
