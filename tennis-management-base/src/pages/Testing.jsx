import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

import './Testing.css';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

import { ContextMenu } from '@base-ui/react/context-menu';


export default function Testing() {

  const [instruments, setInstruments] = useState([]);

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data } = await supabase.from("instruments").select();
    setInstruments(data);
  }


  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger className={'Trigger'}>Right click here</ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Positioner className={'Positioner'}>
            <ContextMenu.Popup className={'Popup'}>
              <ContextMenu.Item className={'Item'}>Add to Library</ContextMenu.Item>
              <ContextMenu.Item className={'Item'}>Add to Playlist</ContextMenu.Item>
              <ContextMenu.Separator className={'Separator'} />
              <ContextMenu.Item className={'Item'}>Play Next</ContextMenu.Item>
              <ContextMenu.Item className={'Item'}>Play Last</ContextMenu.Item>
              <ContextMenu.Separator className={'Separator'} />
              <ContextMenu.Item className={'Item'}>Favorite</ContextMenu.Item>
              <ContextMenu.Item className={'Item'}>Share</ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <div >
        <span>Instruments</span>
        <ul>
          {instruments.map((instrument) => (
            <li key={instrument.name}>{instrument.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}