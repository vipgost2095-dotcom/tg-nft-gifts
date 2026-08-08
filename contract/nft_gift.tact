import "@stdlib/deploy";
import "@stdlib/ownable";
import "@stdlib/dns";

// Сообщение для минта
message Mint {
    query_id: Int as uint64;
    owner: Address;
    content: Cell; // Ссылка на JSON метаданных
}

contract NftGiftCollection with Deployable, Ownable {
    const PRICE: Int = ton("0.05"); // Цена минта
    
    next_item_index: Int as uint64;
    collection_content: Cell;
    nft_item_code: Cell;
    royalty_params: RoyaltyParams;
    
    init(owner: Address, collection_content: Cell, nft_item_code: Cell) {
        self.owner = owner;
        self.next_item_index = 0;
        self.collection_content = collection_content;
        self.nft_item_code = nft_item_code;
        self.royalty_params = RoyaltyParams{
            numerator: 5, // 5% роялти
            denominator: 100,
            destination: owner
        };
    }

    receive("mint") {
        require(context().value >= self.PRICE, "Insufficient funds");
        
        // Генерируем контент для конкретного NFT
        let nftContent = beginCell()
            .storeUint(self.next_item_index, 64)
            .storeRef(self.collection_content)
            .endCell();

        // Деплоим NFT Item
        let nftItemInit = initOf NftItem(
            myAddress(), 
            self.next_item_index, 
            self.nft_item_code
        );
        
        send(SendParameters{
            to: contractAddress(nftItemInit),
            value: ton("0.02"),
            bounce: false,
            body: NftItemMint{
                itemIndex: self.next_item_index,
                owner: sender(),
                content: nftContent
            }.toCell()
        });

        self.next_item_index += 1;
    }

    get fun get_collection_data(): (Int, Cell, Address) {
        return (self.next_item_index, self.collection_content, self.owner);
    }
}

// Контракт самого NFT (упрощенный для примера)
contract NftItem {
    collection: Address;
    index: Int as uint64;
    owner: Address;
    content: Cell;

    init(collection: Address, index: Int, code: Cell) {
        self.collection = collection;
        self.index = index;
        self.owner = collection; // Временно
        self.content = beginCell().endCell();
    }

    receive(msg: NftItemMint) {
        require(sender() == self.collection, "Invalid sender");
        self.owner = msg.owner;
        self.content = msg.content;
    }
    
    // Геттеры для GetGems
    get fun get_nft_data(): (Int, Int, Address, Address, Cell) {
        return (true, self.index, self.collection, self.owner, self.content);
    }
}

struct RoyaltyParams { numerator: Int; denominator: Int; destination: Address; }
message NftItemMint { itemIndex: Int; owner: Address; content: Cell; }
