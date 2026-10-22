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

/*function Root() {
  return (
    <>
      <Test />
      <Outlet />
    </>
  )
}*/

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
    {/*<Route path="/" element={<Root />}>
      <Route path="login" element={<Login />} />

    </Route>*/}
    <Route path='login' element={<Login />}/>
    <Route path='/' element={<Test />}/>

    <Route path='/skills' element={<Skills />}/>
    </>
    
  )
);


function App() {
  return <RouterProvider router={router} />
}

export default App
