import React, { useContext, useState } from "react";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Paper,
  Box,
  Snackbar
} from "@mui/material";
import { Grid } from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import logo_1 from '../assets/logo1.png';
import { AuthContext } from "../contexts/AuthContext";



// const darkTheme = createTheme({
//   palette: {
//     mode: "dark",
//   },
// });

const defaultTheme = createTheme();

export default function Authentication() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState();
  const [message, setMessage] = useState();
  const [open, setOpen] = useState(false);
  const [formState, setFormState] = useState(0);

  const { handleRegister, handleLogin} = useContext(AuthContext)

  let handleAuth = async ()=> {
    try {
      if(formState === 0){
        let result = await handleLogin(username, password);
      }
      if(formState === 1){
        let result = await handleRegister(name, username, password);
        console.log(result);
        setUsername("")
        setMessage(result);
        setOpen(true);
        setError("");
        setFormState(0);
        setPassword("")
        setName("")
      }
    } catch (error) {
      let message = (error.response.data.message);
      setError(message);
    }
  }
  
  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh', width: '100vw' }}>
        <CssBaseline />

        <Grid
          size={{ xs: 0, sm: 4, md: 7 }}   
          sx={{
            display: { xs: "none", md: "block" },
            backgroundImage: `url(${logo_1})`,
            minWidth: '350px',
            height: '100vh',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />


        <Grid
          size={{ xs: 12, sm: 8, md: 5 }}   
          component={Paper}
          elevation={6}
          square
        >
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>

            <div>
              <Button variant={formState === 0? 'contained' : ""} onClick={()=> setFormState(0)} >
                Sign In
              </Button>
              <Button variant={formState === 1? 'contained' : ""} onClick={()=> setFormState(1)} >
                Sign Up
              </Button>
            </div>

            <Box component="form" noValidate sx={{ width: '100%', maxWidth: 420 }}>
              { formState === 1? 
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  label="Full Name"   
                  value={name}
                  onChange={(e)=>setName(e.target.value)}               
                />
              :<></>}
              <TextField
                margin="normal"
                required
                fullWidth
                name="username"
                label="Username"
                value={username}
                id="username"
                onChange={(e)=>setUsername(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                value={password}
                type="password"  
                onChange={(e)=>setPassword(e.target.value)}           
              />

              <p style={{ color: "red" }}>{error}</p>

              <Button
                fullWidth
                variant="contained"
                type="button"
                sx={{ mt: 3 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Login" : "Register"} 
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar open={open} autoHideDuration={4000} message={message} />
    </ThemeProvider>
  );
}
