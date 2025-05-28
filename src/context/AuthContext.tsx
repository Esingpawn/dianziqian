import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { message } from 'antd';
// Import ApiUser directly, as User was renamed to ApiUser in api/auth.ts
import { getCurrentUser, login, LoginParams, LoginResponseData, ApiUser } from '../api/auth'; 
import { AppApiResponse } from '../utils/request';
import { AxiosResponse } from 'axios';

// 用户接口 (AuthContext internal User definition - this is fine)
export interface User {
// ... existing code ...
} 