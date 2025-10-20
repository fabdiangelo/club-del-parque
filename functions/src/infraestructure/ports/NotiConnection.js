import { rtdb } from '../FirebaseServices.js'

export default class NotiConnection{
  constructor(){
    this.rtdb = rtdb;
  }

  async pushNotificationTo(uid, payload = {}) {
    if (!uid) return;
    try {
      const ref = this.rtdb.ref(`notificaciones/${uid}`);
      const newRef = ref.push();
      const data = {
        id: newRef.key,
        fecha: Date.now(),
        leido: false,
        ...payload,
      };
      await newRef.set(data);
      return data;
    } catch (e) {
      console.error('pushNotificationTo error', e);
      return null;
    }
  }
}