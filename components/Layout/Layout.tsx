import React from 'react'
import dynamic from 'next/dynamic'
import Header from '../Header';
import styles from './Layout.module.scss';

const Footer = dynamic(() => import('../Footer'))

const Layout = ({children, onLogOut, isLoggedIn}: {children: React.ReactNode, onLogOut?: () => void, isLoggedIn?: boolean}) => {
  return (
    <section className={styles.layout}>
      <Header onLogOut={() => onLogOut && onLogOut()} isLoggedIn={isLoggedIn}/>
      <div className={styles.container}>
        {children}
      </div>
      {/* <Footer /> */}
    </section>
  )
}

export default Layout
