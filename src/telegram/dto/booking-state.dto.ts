export type BotStep =
    | 'IDLE'
    | 'AWAITING_BOOKING_TYPE'
    | 'AWAITING_MASTER_SELECT'
    | 'AWAITING_SPECIALIZATION'
    | 'AWAITING_SERVICE_SELECT'
    | 'AWAITING_SLOT_SELECT'
    | 'AWAITING_CONFIRM'
    | 'AWAITING_GUEST_NAME'
    | 'AWAITING_GUEST_PHONE'
    | 'AWAITING_REVIEW_COMMENT';

export interface BookingSessionData {
    step: BotStep;
    masterPage?: number;
    selectedMasterId?: number;
    selectedServiceId?: number;
    selectedSlot?: string;
    guestName?: string;
    guestPhone?: string;
    pendingReviewAppointmentId?: number;
    pendingReviewRating?: number;
    linkedUserId?: number | null;
}
