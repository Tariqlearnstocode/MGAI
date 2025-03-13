import { Outlet } from 'react-router-dom';
import AppSidebar from './AppSidebar';

export default function AppLayout() {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}