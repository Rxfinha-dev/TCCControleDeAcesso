using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.IO.Ports;

namespace TCCControleDeAcesso.Models
{
    public class SerialPortManager
    {
        public static SerialPort Port { get; } = new SerialPort();
    }
}
