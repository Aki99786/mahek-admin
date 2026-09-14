import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware'

// The session token itself lives in an httpOnly cookie managed by the API.
// Only user details are persisted client-side; a non-empty userDetail means
// "believed logged in" until GET /auth/me says otherwise.

// Drop the pre-cookie persisted token so it cannot linger in localStorage.
try {
  localStorage.removeItem("token-store");
} catch {
  // storage unavailable — nothing to clean
}

// --------------------
// User Detail Store (object-based)
// --------------------

export interface UserDetailStore {
  userDetail: Record<string, any>;
  setUserDetail: (userDetail: Record<string, any>) => void;
  updateUserDetail: (data: Record<string, any>) => void;
  clearUserDetail: () => void;
};

export const isLoggedIn = (userDetail: Record<string, unknown>) =>
  Boolean(userDetail && (userDetail.id || userDetail._id || userDetail.email));

export const useUserDetailStore = create<UserDetailStore>()(
  devtools(
    persist(
      (set, get) => ({
        userDetail: {},
        setUserDetail: (userDetail) => set({ userDetail }),
        updateUserDetail: (data) =>
          set({
            userDetail: { ...get().userDetail, ...data },
          }),
        clearUserDetail: () => set({ userDetail: {} }),
      }),
      {
        name: "user-detail-store",
        partialize: (state) => ({ userDetail: state.userDetail }), // ✅ only persist this
      }
    )
  )
);


// --------------------
// Confirmation Store (object-based)
// --------------------

export interface ConfirmationStore {
  open: boolean;
  data: Record<string, any> | null;
  resolver: ((value: any) => void) | null;

  openConfirmation: (data?: Record<string, any>) => Promise<any>;
  closeConfirmation: (result?: any) => void;
}

// export const confirmationStore = create<ConfirmationStore>()(
//   devtools((set, get) => ({
//     open: false,
//     data: null,
//     resolver: null,

//     // Open + set data + return promise
//     openConfirmation: (data: null) => {
//       return new Promise((resolve) => {
//         set({
//           open: true,
//           data,
//           resolver: resolve,
//         });
//       });
//     },

//     // Close + return data to parent
//     closeConfirmation: (result = null) => {
//       const { resolver, data } = get();

//       if (resolver) {
//         resolver({
//           confirmed: !!result,
//           data,         // <-- parent gets data here ⭐
//         });
//       }

//       set({
//         open: false,
//         data: null,
//         resolver: null,
//       });
//     },
//   }))
// );



export const confirmationStore = create<ConfirmationStore>()(
  devtools((set, get) => ({
    open: false,
    data: null,
    resolver: null,

    openConfirmation: (data: any) => {
      return new Promise((resolve) => {
        set({
          open: true,
          data: data ?? null,
          resolver: resolve,
        });
      });
    },

    closeConfirmation: (result = false) => {
      const { resolver, data } = get();

      if (resolver) {
        resolver({
          confirmed: !!result,
          data: data ?? null,
        });
      }

      // Reset state
      set({
        open: false,
        data: null,
        resolver: null,
      });
    },
  }))
);
