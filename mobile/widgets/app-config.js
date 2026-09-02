const menocompassWidgetsPlugin = [
  'expo-widgets',
  {
    bundleIdentifier: 'com.kyl3kan3.menlopass.widgets',
    groupIdentifier: 'group.com.kyl3kan3.menlopass',
    enablePushNotifications: false,
    widgets: [
      {
        name: 'MenoCompassCheckIn',
        displayName: 'Daily Check-In',
        description: 'Open a private daily check-in and see recent logging progress.',
        supportedFamilies: ['systemSmall', 'systemMedium'],
      },
      {
        name: 'MenoCompassInsights',
        displayName: 'Pattern Insights',
        description: 'Open private insights and see recent logging progress.',
        supportedFamilies: ['systemSmall', 'systemMedium'],
      },
    ],
  },
];

module.exports = { menocompassWidgetsPlugin };
