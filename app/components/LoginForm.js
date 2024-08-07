'use client';
import {useFormState} from 'react-dom';
// import Login from './Login';
// import Search from '@/ui/Search';
import '@/globals.css';
import { set } from 'mongoose';
import {login} from '@/actions';

const initialState = {
    message: '',
}

export default function LoginForm(){
    console.count('LoginForm called');
    const [state, formAction] = useFormState(login, initialState);
    if(state.message === 'Success'){
        return(
            <div>
                <h1>Success</h1>
            </div>
        )}
    
    return (
        <div>
            <form action={formAction} className="flex flex-col justify-center mt-7">
                <main className="flex justify-center items-center px-16 h-screen text-sm text-blue-500 bg-white max-md:px-5">
                    <section className="flex flex-col flex-wrap justify-center content-center px-4 pt-20 pb-20 max-w-full bg-white border border-solid border-neutral-800 border-opacity-30 w-[375px]">
                        <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/0f9feb2ad2ef767399e5ed8fa9c083f66640cce34d6452358aff36ac391d6edd?apiKey=8cee1f60e6bf4f68b8bdc4b0ce71214d&" alt="" className="self-center mt-6 max-w-full aspect-[3.7] fill-neutral-800 w-[182px]" />   
                        <div>
                            <div className={`flex flex-col justify-center tracking-normal whitespace-nowrap text-black`}>
                                <input
                                    type="text"
                                    id = "username"
                                    name = "username"
                                    required
                                    placeholder={"Username"}
                                    className="login-input"
                                    aria-label={"Username"}
                                />
                            </div>
                            <div className={`flex flex-col justify-center tracking-normal whitespace-nowrap mt-3 text-black text-opacity-20`}>
                                <input
                                    type="password"
                                    id = "password"
                                    name = "password"
                                    required
                                    placeholder={"Password"}
                                    className="login-input"
                                    aria-label={"Password"}
                                />
                            </div>
                            <div className={`flex flex-col justify-center font-semibold tracking-normal text-center text-white mt-6`}>
                                <button type="submit" className="btn btn-primary rounded-md">
                                    Login
                                </button>
                            </div>
                            <p style={{ color: 'red' }}>{state.message}</p>
                        </div>
                    </section>
                </main>
            </form>
        </div>
    ); 
}