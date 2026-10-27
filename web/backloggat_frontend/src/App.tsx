import './App.css'
import Test from './components/Test'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Login from './pages/Login';
import Skills from './pages/Skills';
import ProtectedRoute from './pages/ProtectedRoute';
import Knowledges from './pages/Knowledges';
import Passwords from './pages/Passwords';
import Resources from './pages/Resources';
import Notes from './pages/Notes';
import Lists from './pages/Lists';
import ListDays from './pages/ListDays';
import DayView from './pages/Lists/DayView';
import Projects from './pages/Projects/Projects';
import ProjectView from './pages/Projects/ProjectView';

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
      {
        path: "/knowledges",
        element: <Knowledges />,
      },
      {
        path: "/passwords",
        element: <Passwords />,
      },
      {
        path: "/resources",
        element: <Resources />,
      },
      {
        path: "/notes",
        element: <Notes />,
      },
      {
        path: "/",
        element: <Lists />,
      },
      {
        path: "/lists",
        element: <Lists />,
      },
      {
        path: "/lists/:id",
        element: <ListDays />,
      },
      {
        path: "/lists/:id/days/:dayId",
        element: <DayView />,
      },
      {
        path: "/projects",
        element: <Projects />,
      },
      {
        path: "/projects/:id",
        element: <ProjectView />,
      },
    ],
  },
]);


function App() {
  return <RouterProvider router={router} />
}

export default App
