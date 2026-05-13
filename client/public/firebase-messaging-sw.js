importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyB5UFJiXrFTx2swa-itnJ_BFWaEHeD6_iI",
  authDomain: "vibechat-f023a.firebaseapp.com",
  projectId: "vibechat-f023a",
  storageBucket: "vibechat-f023a.firebasestorage.app",
  messagingSenderId: "349285931107",
  appId: "1:349285931107:web:914b3cc0e9129367994056"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
