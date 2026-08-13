export default function Home() {
  return (
    <main style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <div>
        <h1>Tevora - Take Home Chat (scaffold)</h1>
        <p>Next steps:
          <ul>
            <li>Wire up Auth (next-auth) and session</li>
            <li>Run Prisma migrate to create database tables</li>
            <li>Add chat UI and server-side Claude API route</li>
          </ul>
        </p>
      </div>
    </main>
  );
}
