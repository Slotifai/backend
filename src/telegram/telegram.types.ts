import {Context, SessionFlavor} from 'grammy';
import {BookingSessionData} from './dto/booking-state.dto';

export type BotContext = Context & SessionFlavor<BookingSessionData>;
