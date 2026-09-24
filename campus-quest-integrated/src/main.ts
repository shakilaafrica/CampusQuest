import './style.css';
import { session } from './network';
import { showMainMenu } from './game/mainMenu';

// The main menu is always the first screen. Restoring a remembered login
// happens in the background; the menu updates when it finishes.
showMainMenu();
void session.init();
