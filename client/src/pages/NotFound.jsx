import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="container page" style={{ alignItems: 'center', textAlign: 'center', padding: '96px 20px' }}>
      <div className="big-404">4<em>0</em>4</div>
      <h1 className="h3" style={{ fontSize: '1.4rem' }}>This plate is empty.</h1>
      <p className="text-2">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-lg"><ArrowLeft /> Back to home</Link>
    </section>
  );
}
