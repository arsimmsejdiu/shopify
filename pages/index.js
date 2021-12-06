import Head from 'next/head';
import Sidebar from '../components/Sidebar'

export default function Home() {
  return (
    <div className="">
      <Head>
        <title>Spotify 2.0 - Best music to listen</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <main>
        {/* Sidebar */}
        <Sidebar />
        {/* CEnter Content */}
      </main>

      {/* Player */}
    </div>
  )
}
