import React from 'react';
import styles from './Footer.module.scss';
import Link from 'next/link'
import Image from 'next/image'
import vercelLogo from '../../public/logoVercel.png';
import { useMediaQuery } from 'react-responsive'

const Footer = () => {
  const isDesktopOrLaptop = useMediaQuery({
    query: '(min-device-width: 768px)'
  })

  return (
    <footer className={styles.footer}>
    </footer>
  )
}

export default Footer;
