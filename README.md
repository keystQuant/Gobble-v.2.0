# Gobble  

고블은 FnGuide 데이터 수집기입니다. API 요청 방식에 따라 데이터 수집 태스크를 관리할 수 있도록 설계되었습니다.  

매일 10분 단위로 FnGuide로 요청보내 데이터가 업데이트 되었는지 확인합니다.  

새로운 날짜 데이터가 확인된다면, 새로운 데이터를 모두 가공하여 레디스 캐시로 옮깁니다.  

그리고 데이터 저장 서버로 API 요청을 보내어 캐시로부터 데이터를 호출하여 저장하도록 시킵니다.  

새로운 데이터가 모두 저장된 후에는 데이터 수집 태스크가 실행되지 않도록 합니다.
