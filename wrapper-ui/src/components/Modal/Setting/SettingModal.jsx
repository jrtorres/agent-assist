import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  Input,
} from "@chakra-ui/react";
import PropTypes from "prop-types";

import { IoSettingsOutline } from "react-icons/io5";

export function SettingModal({ children }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <span onClick={onOpen}>{children}</span>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex gap-1 items-center">
            <IoSettingsOutline className="text-green-600" />
            <p>Settings</p>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={5}>
            <div className="flex-col gap-2 mb-4">
              <label htmlFor="" className="text-slate-500 text-[14px] mb-4">
                Username{" "}
              </label>
              <Input
                className="border border-green-600"
                placeholder="john doe"
              />
            </div>
            <div className="flex-col gap-2 mb-4">
              <label htmlFor="" className="text-slate-500 text-[14px] mb-4">
                Password{" "}
              </label>
              <Input placeholder="********" />
            </div>
            <div className="flex-col gap-2 mb-4">
              <label htmlFor="" className="text-slate-500 text-[14px] mb-4">
                Host *{" "}
              </label>
              <Input placeholder="testserver.com" />
            </div>
            <div className="flex-col gap-2 mb-4">
              <label htmlFor="" className="text-slate-500 text-[14px] mb-4">
                Port *{" "}
              </label>
              <Input placeholder="8008" />
            </div>
            <div className="flex-col gap-2 mb-4">
              <label htmlFor="" className="text-slate-500 text-[14px] mb-4">
                Path *{" "}
              </label>
              <Input placeholder="ws" />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="black" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button colorScheme="green" onClick={() => onClose()}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

SettingModal.propTypes = {
  children: PropTypes.any,
};
