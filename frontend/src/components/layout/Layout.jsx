import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-surface gradient-mesh">
      <Navbar />
      <main className="pt-[72px] relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
