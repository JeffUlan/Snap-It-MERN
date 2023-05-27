import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  useMediaQuery,
  Typography,
  useTheme,
  Collapse,
  Alert,
  IconButton,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { Formik } from "formik";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setLogin } from "../store/index";
import Dropzone from "react-dropzone";
import FlexBetween from "./UI/FlexBetween";

const registerSchema = yup.object().shape({
  firstName: yup.string().required("required").min(2).max(12),
  lastName: yup.string().required("required").min(2).max(12),
  email: yup.string().email("invalid email").required("required").max(50),
  password: yup.string().required("required").min(5),
  location: yup.string().required("required"),
  occupation: yup.string().required("required"),
  picture: yup.string().required("required"),
});

const loginSchema = yup.object().shape({
  email: yup.string().email("invalid email").required("required").max(50),
  password: yup.string().required("required").min(5),
});

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  location: "",
  occupation: "",
  picture: "",
  otp: "",
};

// const initialValuesLogin = {
//   email: "",
//   password: "",
// };

const Form = () => {
  const [pageType, setPageType] = useState("login");
  const [error, setError] = useState("");
  const [clicked, setClicked] = useState(false);
  const [otpClick, setOtpClick] = useState(false);
  const [otpVerify, setOtpVerify] = useState(false);
  const [validOtp, setValidOtp] = useState("");
  const otpRef = useRef(null);
  const { palette } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const isLogin = pageType === "login";
  const isRegister = pageType === "register";

  if (error) {
    setTimeout(() => {
      setError(false);
      setOtpClick(false);
      setOtpVerify(false);
    }, 5000);
  }

  const register = async (values, { resetForm }) => {
    const verified = await verifyOtp();
    if (!verified) {
      setError("Invalid Otp!");
      setOtpClick(false);
      setOtpVerify(false);
      resetForm();
      setClicked(false);
      return;
    }

    // this allows us to send form info with image
    values.email = values.email.toLowerCase();
    const formData = new FormData();
    for (let value in values) {
      formData.append(value, values[value]);
    }
    formData.append("picturePath", values.picture.name);
    const savedUserResponse = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/auth/register`,
      {
        method: "POST",
        body: formData,
      }
    );

    const savedUser = await savedUserResponse.json();
    resetForm();
    setClicked(false);
    if (savedUser.error) {
      setError("User with this email already exists!");
      setOtpClick(false);
      return;
    }
    if (savedUser) {
      setPageType("login");
    }
  };

  const login = async (values, onSubmitProps) => {
    console.log(("login"));
    values.email = values.email.toLowerCase();
    onSubmitProps.resetForm();
    const loggedInResponse = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    );
    const loggedIn = await loggedInResponse.json();
    setClicked(false);
    if (loggedIn.msg) {
      setError("Invalid Credentials!");
      return;
    }
    if (loggedIn) {
      dispatch(setLogin({ user: loggedIn.user, token: loggedIn.token }));
      navigate("/home");
    }
  };

  const handleFormSubmit = async (values, onSubmitProps) => {
    setClicked(true);
    if (isLogin) await login(values, onSubmitProps);
    if (isRegister) await register(values, onSubmitProps);
  };

  const sendOtp = async (values, onSubmitProps) => {
    console.log("otp");
    setClicked(true);
    setOtpClick(true);
    // console.log(otpRef.current.values.email);
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/register/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: otpRef.current.values.email,
        name: `${otpRef.current.values.firstName} ${otpRef.current.values.lastName}`,
      }),
    });
    const otp = await response.json();
    if (otp.error) {
      setClicked(false);
      setOtpClick(false);
      return;
    }
    if (otp) {
      setValidOtp(otp);
      setClicked(false);
    }
  };

  
  const verifyOtp = async (values, onSubmitProps) => {
    // console.log(String(otpRef.current.values.otp), String(validOtp));
    if (String(otpRef.current.values.otp) === String(validOtp)) return true;
    return false;
  };

  return (
    <Formik
      onSubmit={handleFormSubmit}
      // initialValues={isLogin ? initialValuesLogin : initialValuesRegister}
      initialValues={initialValues}
      validationSchema={isLogin ? loginSchema : registerSchema}
      innerRef={otpRef}
    >
      {({
        values,
        errors,
        touched,
        handleBlur,
        handleChange,
        handleSubmit,
        setFieldValue,
        resetForm,
      }) => (
        <form onSubmit={handleSubmit}>
          <Box
            display="grid"
            gap="30px"
            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            }}
          >
            {isRegister && (
              <React.Fragment>
                <TextField
                  label="First Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.firstName}
                  name="firstName"
                  error={
                    Boolean(touched.firstName) && Boolean(errors.firstName)
                  }
                  helperText={touched.firstName && errors.firstName}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  label="Last Name"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.lastName}
                  name="lastName"
                  error={Boolean(touched.lastName) && Boolean(errors.lastName)}
                  helperText={touched.lastName && errors.lastName}
                  sx={{ gridColumn: "span 2" }}
                />
                <TextField
                  label="Location"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.location}
                  name="location"
                  error={Boolean(touched.location) && Boolean(errors.location)}
                  helperText={touched.location && errors.location}
                  sx={{ gridColumn: "span 4" }}
                />
                <TextField
                  label="Occupation"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={values.occupation}
                  name="occupation"
                  error={
                    Boolean(touched.occupation) && Boolean(errors.occupation)
                  }
                  helperText={touched.occupation && errors.occupation}
                  sx={{ gridColumn: "span 4" }}
                />
                <Box
                  gridColumn="span 4"
                  border={`1px solid ${palette.neutral.medium}`}
                  borderRadius="5px"
                  p="1rem"
                >
                  <Dropzone
                    accept={{
                      "image/png": [".png"],
                      "image/jpg": [".jpg"],
                      "image/jpeg": [".jpeg"],
                    }}
                    multiple={false}
                    onDrop={(acceptedFiles) => {
                      setFieldValue("picture", acceptedFiles[0]);
                      // console.log(acceptedFiles);
                    }}
                  >
                    {({ getRootProps, getInputProps }) => (
                      <Box
                        {...getRootProps()}
                        border={`2px dashed ${palette.primary.main}`}
                        p="1rem"
                        sx={{ "&:hover": { cursor: "pointer" } }}
                      >
                        <input {...getInputProps()} />
                        {!values.picture ? (
                          <p>Add Picture Here</p>
                        ) : (
                          <FlexBetween>
                            <Typography>{values.picture.name}</Typography>
                            <EditOutlinedIcon />
                          </FlexBetween>
                        )}
                      </Box>
                    )}
                  </Dropzone>
                </Box>
              </React.Fragment>
            )}

            <TextField
              label="Email"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.email}
              name="email"
              error={Boolean(touched.email) && Boolean(errors.email)}
              helperText={touched.email && errors.email}
              sx={{ gridColumn: "span 4" }}
            />
            <TextField
              label="Password"
              type="password"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.password}
              name="password"
              error={Boolean(touched.password) && Boolean(errors.password)}
              helperText={touched.password && errors.password}
              sx={{ gridColumn: "span 4" }}
            />
            {!error && !isLogin && otpClick && (
              <TextField
                label="Enter your Otp"
                type="text"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.otp}
                name="otp"
                error={
                  Boolean(touched.otp) &&
                  otpClick &&
                  (!values.otp || values.otp.length !== 4)
                }
                helperText={
                  values.otp && values.otp.length !== 4
                    ? "Otp must be exactly 4 characters"
                    : null
                }
                sx={{ gridColumn: "span 4" }}
              />
            )}
            {!error && !isLogin && otpClick && !otpVerify && (
              <Typography
                fontWeight="400"
                variant="h5"
                sx={{
                  width: "20rem",
                  color: palette.primary.main,
                  mt: "-1.3rem",
                  ml: "0.4rem",
                }}
              >
                Check your e-mail and enter the otp
              </Typography>
            )}
          </Box>

          {/* ALERT */}
          {error && (
            <Box sx={{ width: "100%", pt: "2%" }}>
              <Collapse in={error}>
                <Alert
                  severity="error"
                  action={
                    <IconButton
                      aria-label="close"
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setError(false);
                      }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  }
                  sx={{ fontSize: "0.95rem" }}
                >
                  {error}
                </Alert>
              </Collapse>
            </Box>
          )}

          {/* BUTTONS */}
          <Box>
            <Button
              fullWidth
              type={isLogin || otpClick ? "submit" : "button"}
              sx={{
                m: "2rem 0",
                p: "1rem",
                backgroundColor: !clicked ? palette.primary.main : "#808080",
                color: !clicked ? palette.background.alt : "#101010",
                "&:hover": {
                  color: !clicked ? palette.primary.main : null,
                  backgroundColor: !clicked ? null : "#808080",
                },
                "&:disabled": {
                  color: !clicked ? palette.background.alt : "#101010",
                },
              }}
              disabled={
                clicked ||
                (!values.email && !values.password) ||
                (pageType === "login"
                  ? Object.keys(errors).length !== 0
                  : !values.firstName ||
                    !values.lastName ||
                    !values.location ||
                    !values.occupation ||
                    !values.picture ||
                    Object.keys(errors).length !== 0) ||
                (!isLogin &&
                  otpClick &&
                  (!values.otp || values.otp.length !== 4))
              }
              onClick={!otpClick && pageType !== "login" ? sendOtp : null}
            >
              {!clicked
                ? isLogin
                  ? "LOGIN"
                  : !isLogin && !otpClick
                  ? "VERIFY EMAIL / SEND OTP"
                  : "VERIFY OTP AND REGISTER"
                : "WAIT..."}
              {/* {console.log(errors, otpClick, values.otp)} */}
            </Button>
            <Typography
              onClick={() => {
                setPageType(isLogin ? "register" : "login");
                resetForm();
              }}
              sx={{
                textDecoration: "underline",
                color: palette.primary.main,
                "&:hover": {
                  cursor: "pointer",
                  color: palette.primary.light,
                },
              }}
            >
              {isLogin
                ? "Don't have an account? Sign Up here."
                : "Already have an account? Login here."}
            </Typography>
          </Box>
        </form>
      )}
    </Formik>
  );
};

export default Form;
