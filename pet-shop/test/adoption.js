const Adoption = artifacts.require("Adoption");

/*
 * uncomment accounts to access the test accounts made available by the
 * Ethereum client
 * See docs: https://www.trufflesuite.com/docs/truffle/testing/writing-tests-in-javascript
 */
contract("Adoption", function (accounts) {
  describe("First group of tests", () => {
    let instance;

    before(async () => {
      instance = await Adoption.deployed();
    });

    it("User should adopt a pet", async () => {
      await instance.adopt.sendTransaction(8, {
        from: accounts[0]
      });

      const adopter = await instance.adopters.call(8);
      assert.equal(adopter, accounts[0], "Incorrect owner address!");
    });

    it("Should get adoptor address by pet id in array", async () => {
      const adopters = await instance.getAdopters.call();
      assert.equal(adopters[8], accounts[0], "Owner of petId 8 should already have been recorde in array!");
    });

    it("Should throw error if invalid petId is given", async () => {
      try {
        await instance.adopt.sendTransaction(17, {
          from: accounts[0]
        });
        assert.fail(true, false, "Should have thrown error!!");
      } catch (error) {
        assert.include(String(error), "revert", `Expected "revert", but got ${error} instead!`);
      }
    });

  });
});
