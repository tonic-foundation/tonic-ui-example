/**
 * Re-exports common icons from react-icons
 */
import {
  HiChevronDown as ChevronDown,
  HiChevronRight as ChevronRight,
} from 'react-icons/hi';
import { TbArrowLeft as Back } from 'react-icons/tb';
import { RiExternalLinkFill as Link } from 'react-icons/ri';
import {
  MdLogout as Logout,
  MdClose as Close,
  MdOutlineMoreHoriz as More,
  MdContentCopy as Copy,
  MdOutlineMenu as Menu,
  MdSettings as Settings,
} from 'react-icons/md';
import { BiLogIn as Login } from 'react-icons/bi';
import {
  FaDiscord as Discord,
  FaGithub as Github,
  FaTelegramPlane as Telegram,
  FaTwitter as Twitter,
  FaMedium as Medium,
} from 'react-icons/fa';
import { AiOutlineLoading3Quarters as LoadingSpin } from 'react-icons/ai';
import { IoIosSunny as LightMode, IoIosMoon as DarkMode } from 'react-icons/io';

import { NearIcon } from './NearLogo';
import { LogoIcon } from './Logo';
import UsnIcon from '../rewards/UsnIcon';

const Icon = {
  Back,
  ChevronDown,
  ChevronRight,
  Close,
  Copy,
  DarkMode,
  LightMode,
  Link,
  LoadingSpin,
  Login,
  Logout,
  Menu,
  More,
  Settings,

  Discord,
  Github,
  Medium,
  Telegram,
  Twitter,

  Near: NearIcon,
  Tonic: LogoIcon,
  Usn: UsnIcon,
};

export default Icon;
