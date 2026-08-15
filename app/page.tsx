export default function Home() {
  return (
    <main style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
      <div>
        <h1>Tevora - Take Home Chat</h1>
        <p>Ready to start chatting! Get started:</p>
        <ul style={{marginTop:'1rem',marginLeft:'1.5rem'}}>
          <li><a href="/signup">Sign up</a> for an account</li>
          <li><a href="/login">Log in</a> with your credentials</li>
          <li>Start chatting with Claude AI</li>
        </ul>
      </div>
    </main>
  );
}
