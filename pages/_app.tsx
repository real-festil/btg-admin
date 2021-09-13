import '../styles/globals.css'
import type { AppProps } from 'next/app';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import firebase from 'firebase'

function MyApp({ Component, pageProps }: AppProps) {
  const firebaseConfig = {
    apiKey: 'AIzaSyDC687M_5QuoiOW3hrugamnjpNt2E9vraA',
    authDomain: "bringthegym-6185a.firebaseapp.com",
    databaseURL: "https://bringthegym-6185a-default-rtdb.firebaseio.com",
    projectId: "bringthegym-6185a",
    storageBucket: "bringthegym-6185a.appspot.com",
    messagingSenderId: "74892996588",
    appId: "1:74892996588:web:53d3567d0aed858c2a1ac9"
  };

  try {
    firebase.initializeApp(firebaseConfig);
  } catch(err){
      console.error('Firebase initialization error', err);
  }
  return (
    <>
      <Component {...pageProps} />
    </>
  )
}
export default MyApp
