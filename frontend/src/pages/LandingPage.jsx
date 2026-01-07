import React from 'react'
import '../App.css'
import { Link, useNavigate } from "react-router-dom"
import mobile_png from "../assets/mobile.png"

const LandingPage = () => {
  const router = useNavigate();

  return (
    <div className='container'>
      <div className='landingPageContainer small-container'>
        <nav>

          <div className="logo">
            <h2>Apna Video Call</h2>
          </div>

          <div className="navlist">

            <p onClick={()=>{
              window.location.href = ("/q123rndm")
            }}>Join as guest</p>

            <p className='none' onClick={()=>{
              router("/auth")
            }}>Register</p>

            <div className='p' role='button' onClick={()=>{
              router("/auth")
            }}>Login</div>
          </div>

        </nav>


        <div className="LandingMainContainer">
          <div className="info">
            <h1><span style={{color: " #ff9839"}}> Connect</span> with your loved Ones</h1>
            <p>Cover a distance by Apna Vido Call</p>
            <div className='btn' role='button'>
              <Link to={"/auth"}> Get Started</Link>
            </div>
          </div>

          <div className="img">
            <img src={mobile_png} alt="" />
          </div>


        </div>
      </div>
    </div>
  )
}

export default LandingPage