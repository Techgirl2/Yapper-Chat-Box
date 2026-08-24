import Link from "next/link";
import styles from "./home.module.css";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.background}></div>

      <main className={styles.main}>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>✨ Yapper</h1>
            <p className={styles.subtitle}>Chat with Claude AI in your journal</p>
          </div>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💬</div>
              <h3>Beautiful Conversations</h3>
              <p>Journal-style chat with a soft, aesthetic design</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>💾</div>
              <h3>Multiple Chats</h3>
              <p>Create and manage multiple conversations</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>❤️</div>
              <h3>Curated Experience</h3>
              <p>Heart animations and pastel aesthetics</p>
            </div>
          </div>

          <div className={styles.ctaContainer}>
            <Link href="/signup" className={`${styles.btn} ${styles.btnPrimary}`}>
              Get Started
            </Link>
            <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
              Log In
            </Link>
          </div>

          <p className={styles.footnote}>Powered by Claude AI • Built with Next.js</p>
        </div>
      </main>
    </div>
  );
}
