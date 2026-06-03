/**
 * Public marketing shell: navbar + routed outlet only.
 */
import { Outlet } from 'react-router-dom';
import Navbar from '../../../components/Navbar/code/Navbar';
import '../styles/PublicLayout.css';

export default function PublicLayout() {
  return (
    <div className="ec-public-layout">
      <Navbar variant="public" />
      <main className="ec-public-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
