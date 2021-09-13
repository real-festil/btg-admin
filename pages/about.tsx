import Head from 'next/head'
import styles from '../styles/About.module.scss';
import Layout from '../components/Layout';

export default function Home() {
  return (
    <div className={styles.container}>
      {/* <Head>
        <title>Observer VC | About</title>
        <meta name="description" content="Observer uses data from Google’s Pagespeed Insights API to get performance metrics for venture fund websites" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <h1 className={styles.title}>About Observer</h1>
        <p className={styles.text}>
            Observer mission is to promote Web Vitals metrics in VC and startup markets.<br /><br />
            Observer uses data from Google’s Pagespeed Insights API to get performance metrics for venture fund websites.<br /><br />
            Overall score = (Psi score mobile * Mobile weight + Psi score desktop * Desktop weight) * Usability score.<br /><br />
            Usability score is an answer to question if a website has pages with information about thesis, team and portfolio. It has default value of 1, but can be specified for websites in manual mode. Since a website with lack of content and value will have the best performance metrics, we remove those websites without content from our rating.
        </p>
        <h1 className={styles.title}>Why Pagespeed Insights</h1>
        <p className={styles.text}>Google introduced Web Vitals metric to get website quality metrics to to delivering a great user experience on the web. It has started to use those metrics to range websites in search results in 2021. It is essential for every website to test and optimize for those metrics.
        </p>
        <h1 className={styles.title}>About Observer</h1>
        <p className={styles.text} style={{marginBottom: '60px'}}>List of all VC websites and names is provided by OpenVC.
        </p>
      </Layout> */}
    </div>
  )
}
