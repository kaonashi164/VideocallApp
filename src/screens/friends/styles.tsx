import { StyleSheet } from 'react-native';

export const sItem = StyleSheet.create({
  container: {
    marginTop: 20,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    marginRight: 10
  },
  groupBtn: {
    flexDirection: 'row'
  }
});
