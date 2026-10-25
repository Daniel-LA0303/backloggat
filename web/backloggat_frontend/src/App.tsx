import './App.css'
import Test from './components/Test'

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom";
import Login from './pages/Login';
import Skills from './pages/Skills';
import ProtectedRoute from './pages/ProtectedRoute';

/*function Root() {
  return (
    <>
      <Test />
      <Outlet />
    </>
  )
}*/

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/home",
        element: <Test />,
      },
      {
        path: "/skills",
        element: <Skills />,
      },
    ],
  },
]);


function App() {
  return <RouterProvider router={router} />
}

export default App
