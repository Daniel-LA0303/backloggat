import { useState } from 'react'
import Circles from '../components/Circles'
import UITextField from '../components/UITextField'
import UIButton from '../components/UIButton';
import { useAuth } from '../hooks/useAtuh';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { ScreenSpinner } from '../components/ScreenSpinnerProps';


const Login = () => {

  //const API_URL = "http://localhost:8080";

  const navigate = useNavigate();


  const { login } = useAuth();
  const { request, loading } = useApi();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const loginRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const data = await request<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!data) return;

    console.log(data);

    login(data, data.token);
    navigate('/skills');
  };

  if (loading) return <div className='h-screen'><ScreenSpinner /></div>

  return (
    <>
      <div className="page-bg">
        <Circles />
      </div>

      <main className="relative h-screen z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 py-10 justify-center items-center">

        <div className='w-full md:w-2xl rise glass glass-hi  p-5 rounded-2xl px-5 md:px-16 py-10'>
          <p className='mb-0.5 text-center '>Welcome Again Sir</p>
          <form onSubmit={loginRequest}>

            <UITextField
              label="Email"
              value={email}
              type='email'
              onChange={e => setEmail(e.target.value)}
              placeholder="email1@email.com"
            />

            <UITextField
              label="Passowrd"
              value={password}
              type='password'
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••••••"
            />

            <div className='flex justify-center'>
              <UIButton
                type='submit'
                variant='primary'
                size='medium'
                className='px-10'
              >
                Enter
              </UIButton>
            </div>
          </form>
        </div>
      </main>

    </>
  )
}

export default Login