        import { Text, View, StyleSheet } from 'react-native';
        import { Colors } from '@/constants/Colors';

        export default function QuestsScreen() {
          return (
            <View style={[styles.container, { backgroundColor: Colors.light.background }]}>
              <Text style={[styles.title, { color: Colors.light.text }]}>Quests Screen</Text>
            </View>
          );
        }
        const styles = StyleSheet.create({
          container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
          title: { fontSize: 20, fontWeight: 'bold' },
        });
        