const menocompassWidgetsPlugin = [
  'expo-widgets',
  {
    bundleIdentifier: 'com.kyl3kan3.menlopass.widgets',
    groupIdentifier: 'group.com.kyl3kan3.menlopass',
    enablePushNotifications: false,
    widgets: [
      {
        name: 'MenoCompassCheckIn',
        displayName: 'Today’s page',
        description: 'Log a moment on today’s page and see how many of the last seven days are on record.',
        supportedFamilies: ['systemSmall', 'systemMedium'],
      },
      {
        name: 'MenoCompassInsights',
        displayName: 'Dossier',
        description: 'Open the dossier of findings and see how many of the last seven days are on record.',
        supportedFamilies: ['systemSmall', 'systemMedium'],
      },
    ],
  },
];

module.exports = { menocompassWidgetsPlugin };
