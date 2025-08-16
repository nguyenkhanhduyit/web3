//SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.4.16 <0.9.0;
// Thư viện OpenZeppelin để bảo vệ reentrancy
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TransactionDex is ReentrancyGuard {
    //các biến trạng thái của giao dịch
    enum TransactionState {Pending, Success, Failed }

    //method handle event transfer
    event Transfer(address indexed sender, address indexed receiver,uint256 value,uint256 timestamp,TransactionState state);

    struct TransferStruct {
    //object transfer
    address sender;
    address receiver;
    uint256 value;
    uint256 timestamp;
    TransactionState state;
    }

    TransferStruct[] private transactions;

    //theo dõi số tiền bị treo
    mapping(address => uint256) public pendingWithdrawals;

    function makeTransaction(address payable receiver,uint value) public payable nonReentrant{
        TransactionState state = TransactionState.Pending;
        require(receiver != address(0), "Invalid receiver address");
        require(value >= 0.005 ether, "Value must be greater than 0.0049 ETH");
        require(value <= 0.01 ether, "Value must be smaller than 0.01 ETH");
        //người dùng cần gửi ETH vào contract để thực hiện call. 
        require(msg.value == value, "msg.value must equal to value sent");
        // Sử dụng call thay vì transfer để an toàn hơn
        //giới hạn gas để tránh loop bất tận từ các hợp đồng độc hại.
        //gửi eth tới blockchain
        (bool success, ) = receiver.call{value: value, gas: 30000}("");
        if(success){
            state = TransactionState.Success;
        }
        else {
            state = TransactionState.Failed;
            //trả tiền lại cho sender
            (bool refundSuccess, ) = payable(msg.sender).call{value: value, gas: 30000}("");
            if(!refundSuccess){
            // Ghi lại số tiền bị treo cho người gửi, tiền hoàn trả khong thành công lưu ở contract
            pendingWithdrawals[msg.sender] += value;
            }
        }
        transactions.push(TransferStruct(msg.sender,receiver,value,block.timestamp,state));
        emit Transfer(msg.sender, receiver, value, block.timestamp,state);
    }

    function getMyTransactionCount() public view returns (uint) {
        uint total = 0;
        for (uint i = 0; i < transactions.length; i++) {
            if (transactions[i].sender == msg.sender) {
                total++;
            }
        }
        return total;
    }

    function getMyTransactions(uint start, uint count) public view returns (TransferStruct[] memory) {

    uint total = getMyTransactionCount();

    require(start < total, "Start index out of bounds");

    uint end = start + count;
    if (end > total) {
        end = total;
    }

    uint size = end - start;
    TransferStruct[] memory result = new TransferStruct[](size);
    uint index = 0;

    for (uint i = 0; i < transactions.length ; i++) {
        if (transactions[i].sender == msg.sender) {
                result[index] = transactions[i];
                index++;
        }
    }
    return result;
}

    function withdrawFailed() public nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No funds to withdraw");
        pendingWithdrawals[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
} 