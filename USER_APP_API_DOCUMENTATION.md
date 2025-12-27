# Tài liệu API cho App Người Dùng

## Base URL
```
http://localhost:3000/api
```
(Thay đổi theo môi trường của bạn)

## Authentication
Hầu hết các API yêu cầu xác thực bằng Bearer Token. Token được trả về khi đăng nhập hoặc đăng ký.

**Header:**
```
Authorization: Bearer <access_token>
```

---

## 1. Đăng ký (Registration)

**Endpoint:** `POST /api/auth/register`

**Không cần xác thực**

**Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "roleId": 1
}
```

**Lưu ý:** 
- `roleId: 1` là role USER (người dùng thường)
- Nếu không gửi `roleId`, mặc định sẽ là `1` (USER)

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "roleId": 1,
    "role": {
      "id": 1,
      "name": "USER"
    },
    "createdAt": "2025-01-15T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Dữ liệu không hợp lệ
- `409`: Email đã tồn tại

---

## 2. Đăng nhập (Login)

**Endpoint:** `POST /api/auth/login`

**Không cần xác thực**

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "roleId": 1,
    "role": {
      "id": 1,
      "name": "USER"
    },
    "createdAt": "2025-01-15T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: Email và password là bắt buộc
- `401`: Email hoặc password không đúng

---

## 3. Đăng ký thông tin xe (Register Vehicle)

**Endpoint:** `POST /api/vehicles`

**Cần xác thực (Bearer Token)**

**Request Body:**
```json
{
  "licensePlate": "30A-12345",
  "vehicleType": "car"
}
```

**Lưu ý:**
- `userId` sẽ được tự động lấy từ token, không cần gửi trong body
- `vehicleType` có thể là: `"car"`, `"motorcycle"`, `"truck"`

**Response (201):**
```json
{
  "id": 1,
  "userId": 1,
  "licensePlate": "30A-12345",
  "vehicleType": "car",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "user": {
    "id": 1,
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com"
  },
  "parkingSessions": []
}
```

**Error Responses:**
- `400`: Dữ liệu không hợp lệ
- `401`: Chưa đăng nhập

---

## 4. Lấy danh sách xe của mình

**Endpoint:** `GET /api/vehicles`

**Cần xác thực (Bearer Token)**

**Response (200):**
```json
[
  {
    "id": 1,
    "userId": 1,
    "licensePlate": "30A-12345",
    "vehicleType": "car",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "user": {
      "id": 1,
      "fullName": "Nguyễn Văn A",
      "email": "user@example.com"
    },
    "parkingSessions": []
  }
]
```

**Lưu ý:** API này tự động lọc chỉ trả về xe của người dùng đang đăng nhập.

---

## 5. Lấy thông tin đỗ xe của mình (Parking Sessions)

**Endpoint:** `GET /api/parking-sessions`

**Cần xác thực (Bearer Token)**

**Query Parameters (tùy chọn):**
- `status`: Lọc theo trạng thái (`"active"`, `"completed"`, `"cancelled"`)
- `parkingLotId`: Lọc theo ID bãi đỗ xe

**Ví dụ:**
```
GET /api/parking-sessions?status=active
GET /api/parking-sessions?status=completed
GET /api/parking-sessions?parkingLotId=1&status=completed
```

**Response (200):**
```json
[
  {
    "id": 1,
    "vehicleId": 1,
    "licensePlate": "30A-12345",
    "parkingSlotId": 5,
    "entryTime": "2025-01-15T10:00:00.000Z",
    "exitTime": null,
    "fee": null,
    "status": "active",
    "vehicle": {
      "id": 1,
      "licensePlate": "30A-12345",
      "vehicleType": "car",
      "user": {
        "id": 1,
        "fullName": "Nguyễn Văn A"
      }
    },
    "parkingSlot": {
      "id": 5,
      "slotNumber": "A-05",
      "status": "occupied",
      "parkingLot": {
        "id": 1,
        "name": "Bãi đỗ xe Trung tâm",
        "location": "123 Đường ABC",
        "pricePerHour": 30000
      }
    },
    "payments": []
  }
]
```

**Lưu ý:** API này tự động lọc chỉ trả về phiên đỗ xe của người dùng đang đăng nhập.

---

## 6. Lấy thông tin số tiền cần trả khi đỗ xong

**Endpoint:** `POST /api/parking-sessions/{id}/exit`

**Cần xác thực (Bearer Token)**

**Path Parameters:**
- `id`: ID của parking session

**Response (200):**
```json
{
  "message": "Vehicle exited successfully",
  "parkingSession": {
    "id": 1,
    "vehicleId": 1,
    "licensePlate": "30A-12345",
    "entryTime": "2025-01-15T10:00:00.000Z",
    "exitTime": "2025-01-15T13:00:00.000Z",
    "fee": 96300,
    "status": "completed",
    "vehicle": {
      "id": 1,
      "licensePlate": "30A-12345"
    },
    "parkingSlot": {
      "id": 5,
      "slotNumber": "A-05",
      "parkingLot": {
        "id": 1,
        "name": "Bãi đỗ xe Trung tâm",
        "pricePerHour": 30000
      }
    }
  },
  "feeDetails": {
    "entryTime": "2025-01-15T10:00:00.000Z",
    "exitTime": "2025-01-15T13:00:00.000Z",
    "durationHours": 3,
    "pricePerHour": 30000,
    "firstHourFee": 30000,
    "increaseRate": "10%",
    "feeBreakdown": [
      {
        "hour": 1,
        "fee": 30000
      },
      {
        "hour": 2,
        "fee": 33000
      },
      {
        "hour": 3,
        "fee": 36300
      }
    ],
    "totalFee": 96300
  }
}
```

**Cách tính phí:**
- Giờ đầu tiên: `pricePerHour` (từ bãi đỗ xe)
- Mỗi giờ tiếp theo: tăng 10% so với giờ trước
- Làm tròn lên đến giờ gần nhất
- Tối thiểu 1 giờ

**Error Responses:**
- `400`: Session đã hoàn thành hoặc dữ liệu không hợp lệ
- `404`: Parking session không tồn tại
- `401`: Chưa đăng nhập

---

## 7. Xem lịch sử đỗ xe của người dùng

**Endpoint:** `GET /api/parking-sessions?status=completed`

**Cần xác thực (Bearer Token)**

**Query Parameters:**
- `status=completed`: Lọc chỉ các phiên đã hoàn thành

**Response (200):**
```json
[
  {
    "id": 1,
    "vehicleId": 1,
    "licensePlate": "30A-12345",
    "parkingSlotId": 5,
    "entryTime": "2025-01-15T10:00:00.000Z",
    "exitTime": "2025-01-15T13:00:00.000Z",
    "fee": 96300,
    "status": "completed",
    "vehicle": {
      "id": 1,
      "licensePlate": "30A-12345",
      "vehicleType": "car"
    },
    "parkingSlot": {
      "id": 5,
      "slotNumber": "A-05",
      "parkingLot": {
        "id": 1,
        "name": "Bãi đỗ xe Trung tâm",
        "location": "123 Đường ABC"
      }
    },
    "payments": [
      {
        "id": 1,
        "amount": 96300,
        "paymentMethod": "cash",
        "status": "completed",
        "paymentTime": "2025-01-15T13:00:00.000Z"
      }
    ]
  }
]
```

**Lưu ý:** 
- API này tự động lọc chỉ trả về lịch sử của người dùng đang đăng nhập
- Sắp xếp theo thời gian vào (mới nhất trước)

---

## 8. Lấy thông tin cá nhân

**Endpoint:** `GET /api/auth/profile`

**Cần xác thực (Bearer Token)**

**Response (200):**
```json
{
  "id": 1,
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "roleId": 1,
  "role": {
    "id": 1,
    "name": "USER"
  },
  "createdAt": "2025-01-15T10:00:00.000Z",
  "vehicles": [
    {
      "id": 1,
      "licensePlate": "30A-12345",
      "vehicleType": "car",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "notifications": []
}
```

**Error Responses:**
- `401`: Chưa đăng nhập

---

## 9. Làm mới Access Token (Refresh Token)

**Endpoint:** `POST /api/auth/refresh-token`

**Không cần xác thực**

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Lưu ý:** 
- Access token hết hạn sau 15 phút
- Refresh token hết hạn sau 7 ngày
- Khi access token hết hạn, dùng refresh token để lấy access token mới

---

## 10. Đăng xuất (Logout)

**Endpoint:** `POST /api/auth/logout`

**Không cần xác thực**

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## Tóm tắt các API cần thiết

| Chức năng | Method | Endpoint | Auth |
|-----------|--------|----------|------|
| Đăng ký | POST | `/api/auth/register` | ❌ |
| Đăng nhập | POST | `/api/auth/login` | ❌ |
| Đăng ký xe | POST | `/api/vehicles` | ✅ |
| Lấy danh sách xe | GET | `/api/vehicles` | ✅ |
| Lấy thông tin đỗ xe | GET | `/api/parking-sessions` | ✅ |
| Tính tiền khi ra | POST | `/api/parking-sessions/{id}/exit` | ✅ |
| Lịch sử đỗ xe | GET | `/api/parking-sessions?status=completed` | ✅ |
| Thông tin cá nhân | GET | `/api/auth/profile` | ✅ |
| Refresh token | POST | `/api/auth/refresh-token` | ❌ |
| Đăng xuất | POST | `/api/auth/logout` | ❌ |

---

## Ví dụ sử dụng với cURL

### Đăng ký
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "password": "password123",
    "roleId": 1
  }'
```

### Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Đăng ký xe (cần token)
```bash
curl -X POST http://localhost:3000/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "licensePlate": "30A-12345",
    "vehicleType": "car"
  }'
```

### Lấy thông tin đỗ xe
```bash
curl -X GET http://localhost:3000/api/parking-sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Lấy lịch sử đỗ xe
```bash
curl -X GET "http://localhost:3000/api/parking-sessions?status=completed" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Lấy thông tin cá nhân
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Lưu ý quan trọng

1. **Role ID:**
   - `roleId: 1` = USER (người dùng thường)
   - `roleId: 2` = ADMIN

2. **Tự động lọc dữ liệu:**
   - Khi user đăng nhập với role USER, các API sẽ tự động lọc chỉ trả về dữ liệu của chính họ
   - Không cần gửi `userId` trong request body

3. **Token Management:**
   - Lưu cả `accessToken` và `refreshToken` khi đăng nhập/đăng ký
   - Khi `accessToken` hết hạn, dùng `refreshToken` để lấy token mới
   - Khi đăng xuất, gửi `refreshToken` để vô hiệu hóa

4. **Vehicle Type:**
   - Chỉ chấp nhận: `"car"`, `"motorcycle"`, `"truck"`

5. **Parking Session Status:**
   - `"active"`: Đang đỗ xe
   - `"completed"`: Đã hoàn thành (đã ra khỏi bãi)
   - `"cancelled"`: Đã hủy

