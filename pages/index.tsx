import Head from 'next/head'
import styles from '../styles/Home.module.scss';
import Layout from '../components/Layout';
import React, {useState, useEffect} from 'react';
import firebase from 'firebase';
import moment from 'moment';
import dynamic from 'next/dynamic'
import Skeleton, { SkeletonTheme }  from 'react-loading-skeleton';
import tableStyles from '../components/Table/Table.module.scss';
const Button = dynamic(import('react-bootstrap/esm/Button'), {ssr: false})

const Table = dynamic(() => import('../components/Table'));

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    if (email === 'bilotil.sergiy@gmail.com') {
      firebase.auth().signInWithEmailAndPassword(email, password).then().catch((err) => {alert(err)});
    } else {
      alert('Invalid email')
    }
  }

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      setIsLoggedIn(true);
    }
  })

  return (
    <div className={styles.container}>
      <Head>
        <title>BTG Admin Panel</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout isLoggedIn={isLoggedIn} onLogOut={() => {firebase.auth().signOut(); setIsLoggedIn(false)}}>
        {isLoggedIn ? (
            <Table/>
          ) : (
            <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', paddingTop: '20px'}}>
              <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column', marginBottom: '20px'}}>
                <p style={{margin: 0}}>Email:</p>
                <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className={tableStyles.searchInput}/>
              </div>
              <div style={{display: 'flex', alignItems: 'center', flexDirection: 'column'}}>
                <p style={{margin: 0}}>Password:</p>
                <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} className={tableStyles.searchInput}/>
              </div>
              <Button onClick={onLogin} variant="primary" style={{backgroundColor: 'rgba(208, 217, 222, 0.1)', outline: 'none', border: 'none', marginTop: '20px'}}>Submit</Button>
            </div>
          )}
      </Layout>
    </div>
  )
}
