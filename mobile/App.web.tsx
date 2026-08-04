import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://menlopass.vercel.app';

export default function App() {
  return <View style={styles.container}><StatusBar style="light" /><Text style={styles.title}>MenoCompass</Text><Text style={styles.copy}>The full private tracker is available in the web release.</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL(webUrl)} style={styles.button}><Text style={styles.buttonText}>Open MenoCompass</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  container:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:24,backgroundColor:'#0E1618'},
  title:{fontSize:32,fontWeight:'700',color:'#E9F1EE'},copy:{maxWidth:420,textAlign:'center',color:'#93A8A8',fontSize:16},
  button:{paddingHorizontal:20,paddingVertical:14,borderRadius:10,backgroundColor:'#E9F1EE'},buttonText:{fontWeight:'700',color:'#0E1618'}
});
