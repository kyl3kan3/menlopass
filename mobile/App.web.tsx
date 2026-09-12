import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

const webUrl = process.env.EXPO_PUBLIC_WEB_URL || 'https://menlopass.vercel.app';

export default function App() {
  return <View style={styles.container}><StatusBar style="dark" /><Text style={styles.title}>peri</Text><Text style={styles.copy}>The full private tracker is available in the web release.</Text><Pressable accessibilityRole="link" onPress={() => Linking.openURL(webUrl)} style={styles.button}><Text style={styles.buttonText}>Open peri</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  container:{flex:1,alignItems:'center',justifyContent:'center',gap:16,padding:24,backgroundColor:'#f7f5ef'},
  title:{fontFamily:'Georgia',fontSize:36,fontWeight:'400',color:'#263e37'},copy:{maxWidth:420,textAlign:'center',color:'#68756d',fontSize:16,lineHeight:24},
  button:{paddingHorizontal:24,paddingVertical:16,borderRadius:28,backgroundColor:'#244b43'},buttonText:{fontWeight:'700',color:'#fffefa'}
});
