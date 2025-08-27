using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TCCControleDeAcesso.Views
{
    public partial class frmCarregamento : Form
    {
        private Form _formDestino; // formulário que será aberto depois do carregamento

        // construtor que recebe o form de destino
        public frmCarregamento(Form formDestino)
        {
            InitializeComponent();
            _formDestino = formDestino;
        }

        private void frmCarregamento_Load(object sender, EventArgs e)
        {
            progressBar1.Value = 0;
            progressBar1.Minimum = 0;
            progressBar1.Maximum = 100;
            timer1.Interval = 50; // velocidade da barra (ms)

            // Inicializa o label2 com 0%
            label2.Text = "0%";

            // NÃO inicia o timer aqui - será iniciado no Shown
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            if (progressBar1.Value < 100)
            {
                progressBar1.Value += 2; // velocidade de incremento
                label2.Text = progressBar1.Value.ToString() + "%"; // exibe %
            }
            else
            {
                // CORREÇÃO: Força a atualização visual da ProgressBar
                progressBar1.Value = 100;

                // Trick para forçar a atualização visual
                if (progressBar1.Value == progressBar1.Maximum)
                {
                    progressBar1.Value = progressBar1.Maximum - 1;
                    progressBar1.Value = progressBar1.Maximum;
                }

                label2.Text = "100%";
                timer1.Stop();

                // Pequeno delay antes de abrir o próximo form para garantir que a barra chegue a 100%
                Timer delayTimer = new Timer();
                delayTimer.Interval = 200; // 200ms de delay
                delayTimer.Tick += (s, ev) => {
                    delayTimer.Stop();
                    delayTimer.Dispose();

                    // abre o form de destino
                    _formDestino.Show();
                    // fecha a tela de carregamento
                    this.Close();
                };
                delayTimer.Start();
            }
        }

        private void progressBar1_Click(object sender, EventArgs e)
        {
            // pode deixar vazio
        }

        // MÉTODO QUE ESTAVA FALTANDO - causando o erro
        private void label2_Click(object sender, EventArgs e)
        {
            // pode deixar vazio ou implementar alguma funcionalidade
            // Por exemplo, mostrar informações sobre o carregamento
        }

        // NOVO: Evento que dispara quando o formulário fica visível
        protected override void SetVisibleCore(bool value)
        {
            base.SetVisibleCore(value);

            if (value && this.WindowState != FormWindowState.Minimized)
            {
                // Inicia o timer apenas quando a tela estiver visível
                if (!timer1.Enabled)
                {
                    timer1.Start();
                }
            }
        }
    }
}